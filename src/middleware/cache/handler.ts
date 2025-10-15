/*
 * Copyright (C) 2025 Ty Busby
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { assertKey } from "../../guards/cache";
import { CacheInit } from "../../interfaces/cache";
import { Middleware } from "../../interfaces/middleware";
import { Worker } from "../../interfaces/worker";

import { sortSearchParams } from "./keys";
import { CachePolicy } from "./policy";
import { CacheControlRule } from "./rules/control";
import { IfMatchRule, IfNoneMatchRule } from "./rules/etag";
import { MethodRule } from "./rules/method";
import { ModifiedSinceRule, UnmodifiedSinceRule } from "./rules/modified";
import { RangeRule } from "./rules/range";
import { SecurityRule } from "./rules/security";
import { UpgradeRule } from "./rules/upgrade";
import { getVaryHeader, getVaryKey, isCacheable } from "./utils";
import { VariantResponse } from "./variant";

/**
 * Cache Middleware Implementation
 * @see {@link cache}
 */
export class CacheHandler implements Middleware {
    private readonly init: CacheInit;

    constructor(init: CacheInit) {
        const { name, getKey = sortSearchParams } = init;

        this.init = {
            name: name?.trim() || undefined,
            getKey,
        };
    }

    /**
     * Handles an incoming request through the cache middleware.
     *
     * Behavior:
     * - Opens the configured cache (or the default cache if none specified).
     * - Creates a `CachePolicy` with default rules (GET check, range check, ETag handling).
     * - Executes the policy to determine if a cached response can be returned.
     *   - If a cached response is found and valid per the rules, it is returned.
     *   - If no cached response is usable, the `next()` handler is invoked to fetch a fresh response.
     * - Stores the fresh response in the cache if it is cacheable.
     *
     * @param worker - The Worker instance containing the request and context.
     * @param next - Function to invoke the next middleware or origin fetch.
     * @returns A `Response` object, either from cache or freshly fetched.
     */
    public async handle(worker: Worker, next: () => Promise<Response>): Promise<Response> {
        const cache = this.init.name ? await caches.open(this.init.name) : caches.default;

        const policy = new CachePolicy()
            .use(new CacheControlRule())
            .use(new MethodRule())
            .use(new UpgradeRule())
            .use(new SecurityRule())
            .use(new RangeRule())
            .use(new ModifiedSinceRule())
            .use(new IfNoneMatchRule())
            .use(new UnmodifiedSinceRule())
            .use(new IfMatchRule());

        const cacheResponse = await policy.execute(worker, () =>
            this.getCached(cache, worker.request),
        );
        if (cacheResponse) return cacheResponse;

        const response = await next();

        worker.ctx.waitUntil(this.setCached(cache, worker.request, response));
        return response;
    }

    /**
     * Attempts to retrieve a cached response for the given request.
     *
     * Checks the base cache key first. If the cached response is a `VariantResponse`,
     * it computes the variant-specific key using the `Vary` headers and returns
     * the corresponding cached response. Otherwise, returns the base cached response.
     *
     * @param cache - The Cache object to query.
     * @param request - The Request object for which to retrieve a cached response.
     * @returns A Promise resolving to the cached Response if found, or `undefined` if not cached.
     */
    public async getCached(cache: Cache, request: Request): Promise<Response | undefined> {
        const key = this.getCacheKey(request);

        const response = await cache.match(key.toString());
        if (!response) return undefined;
        if (!VariantResponse.isVariantResponse(response)) return response;

        const vary = VariantResponse.restore(response).vary;
        const varyKey = getVaryKey(request, vary, key);
        return cache.match(varyKey);
    }

    /**
     * Stores a response in the cache for the given request, handling `Vary` headers
     * and response variants.
     *
     * The method follows these rules:
     * 1. If the response is not cacheable, it returns immediately.
     * 2. If no cached entry exists:
     *    - If the response has no `Vary` headers, the response is cached directly.
     *    - If there are `Vary` headers, a `VariantResponse` is created to track
     *      which headers affect caching, and both the variant placeholder and the
     *      actual response are stored.
     * 3. If a cached entry exists and is a `VariantResponse`:
     *    - The `Vary` headers are merged into the variant record.
     *    - The variant-specific response is updated in the cache.
     * 4. If a cached entry exists but is not a variant and the new response has `Vary` headers:
     *    - The cached non-variant is converted into a `VariantResponse`.
     *    - The new response and the original cached response are stored under appropriate variant keys.
     *
     * @param cache - The Cache object where the response should be stored.
     * @param worker - The Worker instance containing the request and execution context.
     * @param clone - The Response object to cache.
     */
    public async setCached(cache: Cache, request: Request, response: Response): Promise<void> {
        if (!isCacheable(request, response)) return;

        const key = this.getCacheKey(request);
        const clone = response.clone();
        const vary = getVaryHeader(clone);
        const cached = await cache.match(key);
        const isCachedVariant = cached && VariantResponse.isVariantResponse(cached);

        if (!cached) {
            if (vary.length === 0) {
                await cache.put(key, clone);
                return;
            }

            const variantResponse = VariantResponse.new(vary);
            variantResponse.expireAfter(clone);
            await cache.put(key, await variantResponse.response());
            await cache.put(getVaryKey(request, variantResponse.vary, key), clone);
            return;
        }

        if (isCachedVariant) {
            const variantResponse = VariantResponse.restore(cached);
            variantResponse.expireAfter(clone);
            if (vary.length > 0) {
                variantResponse.append(vary);
                if (variantResponse.isModified) {
                    await cache.put(key, await variantResponse.response());
                }
            }
            await cache.put(getVaryKey(request, variantResponse.vary, key), clone);
            return;
        }

        if (vary.length === 0) {
            await cache.put(key, clone);
            return;
        }

        // We have an existing cache entry that is non-variant, but the response
        // being processed has a vary header. Create and cache a new variant
        // response that replaces the cached non-variant response. Then save both
        // the new response and the cached response with generated variant keys.
        const variantResponse = VariantResponse.new(vary);
        variantResponse.expireAfter(cached);
        variantResponse.expireAfter(clone);
        await cache.put(key, await variantResponse.response());
        await cache.put(getVaryKey(request, variantResponse.vary, key), clone);
        await cache.put(getVaryKey(request, [], key), cached);
    }

    /**
     * Returns the cache key for a request.
     *
     * By default, this is a normalized URL including the path and query string.
     * However, users can provide a custom `getKey` function when creating the
     * `cache` middleware to fully control how the cache keys are generated.
     *
     * For example, a custom function could:
     *  - Sort or remove query parameters
     *  - Exclude the search/query string entirely
     *  - Modify the path or host
     *
     * This allows complete flexibility over cache key generation.
     *
     * @param request The Request object to generate a cache key for.
     * @returns A URL representing the main cache key for this request.
     */
    public getCacheKey(request: Request): URL {
        const key = this.init.getKey(request);
        assertKey(key);

        key.hash = "";
        return key;
    }
}
