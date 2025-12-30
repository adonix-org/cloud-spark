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

import { HttpHeader } from "../../constants/headers";
import { assertKey } from "../../guards/cache";
import { Middleware } from "../../interfaces/middleware";
import { Worker } from "../../interfaces/worker";

import { CacheInit } from "./interfaces";
import { sortSearchParams } from "./keys";
import { CachePolicy } from "./policy";
import { CacheControlRule } from "./rules/control";
import { MethodRule } from "./rules/method";
import { SecurityRule } from "./rules/security";
import { UpgradeRule } from "./rules/upgrade";
import { addDebugHeaders, getRequestKey, getVaryHeader, getVaryKey, isCacheable } from "./utils";
import { VariantResponse } from "./variant";

/**
 * Cache Middleware Implementation
 */
export class CacheHandler implements Middleware {
    private readonly init: Readonly<CacheInit>;

    constructor(init: CacheInit) {
        const { name, getKey = sortSearchParams, debug = false } = init;

        this.init = {
            name: name?.trim() || undefined,
            getKey,
            debug,
        };
    }

    /**
     * Handles an incoming request through the cache middleware.
     *
     * Behavior:
     * - Opens the configured cache (or the default cache if none specified).
     * - Creates a `CachePolicy` with default rules (GET check, range check, ETag handling).
     * - Executes the policy to determine if a cached response can be used.
     *   - If a cached response is found and valid per the rules, it is returned.
     *   - If no cached response is usable, the `next()` handler is invoked to fetch a fresh response.
     * - Stores the fresh response in the cache if it is cacheable.
     *
     * Note: The cache policy only checks if an existing cached response is usable.
     *       It does not store the response; storage is handled later in `setCached()`.
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
            .use(new SecurityRule());

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
     * Returns `undefined` if no cached response exists or if the cached response
     * fails validation (e.g., rules in `CachePolicy` would prevent it from being used).
     *
     * @param cache - The Cache to query.
     * @param original - The Request for which to retrieve a cached response.
     * @returns A Promise resolving to the cached Response if found and usable, or `undefined`.
     */
    public async getCached(cache: Cache, original: Request): Promise<Response | undefined> {
        const key = this.getCacheKey(original);
        const request = getRequestKey(original.headers, key);
        const response = await this.match(cache, request);

        // Not found in cache.
        if (!response) return undefined;

        // The initial lookup cannot include any range header because
        // it might be a variant metadata response with no body.
        const range = original.headers.get(HttpHeader.RANGE);

        if (VariantResponse.isVariantResponse(response)) {
            // Variant response: compute the variant key.
            const vary = VariantResponse.restore(response).vary;
            const varyKey = getVaryKey(original.headers, key, vary);
            const varyRequest = getRequestKey(original.headers, varyKey);
            if (range !== null) {
                varyRequest.headers.set(HttpHeader.RANGE, range);
            }
            // Perform the actual variant lookup with preconditions and
            // range request headers.
            return await this.match(cache, varyRequest);
        }

        // Non-variant and no range?  Return the response.
        if (range === null) return response;

        // There is a range request header for a non-variant response,
        // perform that additional lookup now.
        request.headers.set(HttpHeader.RANGE, range);
        return await this.match(cache, request);
    }

    /**
     * Attempts to match a request in the given cache.
     *
     * If a cached response is found, it is returned. If the `debug` flag
     * is enabled, the response is augmented with debug headers
     * (e.g., the cache key) before being returned.
     *
     * @param cache - The cache instance to query.
     * @param request - The incoming request to match.
     * @returns The cached `Response` if found, with debug headers if enabled;
     *          otherwise `undefined` if there is no cache hit.
     */
    public async match(cache: Cache, request: Request): Promise<Response | undefined> {
        const response = await cache.match(request);
        if (!response) return;
        if (!this.init.debug) return response;

        return addDebugHeaders(request, response);
    }

    /**
     * Stores a response in the cache for the given request, handling `Vary` headers
     * and response variants.
     *
     * The method follows these rules:
     * 1. If the response is not cacheable (per `isCacheable`), it returns immediately.
     * 2. If no cached entry exists:
     *    - If the response has no `Vary` headers, the response is cached directly.
     *    - If there are `Vary` headers, a `VariantResponse` is created to track
     *      which headers affect caching, and both the variant placeholder and the
     *      actual response are stored.
     * 3. If a cached entry exists and is a `VariantResponse`:
     *    - The `Vary` headers are merged into the variant record.
     *    - The variant-specific response is updated in the cache.
     *    - TTL is updated to match the most permissive TTL from the origin response.
     * 4. If a cached entry exists but is not a variant and the new response has `Vary` headers:
     *    - The cached non-variant is converted into a `VariantResponse`.
     *    - Both the new response and the original cached response are stored under appropriate variant keys.
     *
     * @param cache - The Cache where the response should be stored.
     * @param request - The original request from the Worker.
     * @param response - The Response to cache.
     */
    public async setCached(cache: Cache, request: Request, response: Response): Promise<void> {
        if (!isCacheable(request, response)) return;

        const key = this.getCacheKey(request);
        const clone = response.clone();
        const vary = getVaryHeader(clone);
        const cached = await cache.match(key);

        if (!cached) {
            if (vary.length === 0) {
                await cache.put(key, clone);
                return;
            }

            const variantResponse = VariantResponse.new(vary);
            variantResponse.expireAfter(clone);
            await cache.put(key, await variantResponse.response());
            await cache.put(getVaryKey(request.headers, key, variantResponse.vary), clone);
            return;
        }

        if (VariantResponse.isVariantResponse(cached)) {
            const variantResponse = VariantResponse.restore(cached);
            variantResponse.expireAfter(clone);
            if (vary.length > 0) {
                variantResponse.append(vary);
                if (variantResponse.isModified) {
                    await cache.put(key, await variantResponse.response());
                }
            }
            await cache.put(getVaryKey(request.headers, key, variantResponse.vary), clone);
            return;
        }

        if (vary.length === 0) {
            await cache.put(key, clone);
            return;
        }

        // We have an existing cache entry that is non-variant, but the response
        // being processed has a vary header. Create and cache a new variant
        // response that replaces the cached non-variant response. Save the new
        // response with generated variant key.
        const variantResponse = VariantResponse.new(vary);
        variantResponse.expireAfter(clone);
        await cache.put(key, await variantResponse.response());
        await cache.put(getVaryKey(request.headers, key, variantResponse.vary), clone);
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
