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

import { Worker } from "../../interfaces/worker";
import { assertCacheInit, assertKey } from "../../guards/cache";
import { filterVaryHeader, getVaryHeader, getVaryKey, isCacheable } from "./utils";
import { CachePolicy } from "./policy";
import { MethodRule } from "./rules/method";
import { RangeRule } from "./rules/range";
import { IfMatchRule, IfNoneMatchRule } from "./rules/etag";
import { ModifiedSinceRule, UnmodifiedSinceRule } from "./rules/modified";
import { CacheControlRule } from "./rules/control";
import { Middleware } from "../../interfaces/middleware";
import { sortSearchParams } from "./keys";
import { CacheInit } from "../../interfaces/cache";

/**
 * Creates a Vary-aware caching middleware for Workers.
 *
 * This middleware:
 * - Caches `GET` requests **only**.
 * - Respects the `Vary` header of responses, ensuring that requests
 *   with different headers (e.g., `Origin`) receive the correct cached response.
 * - Skips caching for non-cacheable responses (e.g., error responses or
 *   responses with `Vary: *`).
 *
 * @param init Optional cache configuration object.
 * @param init.name Optional name of the cache to use. If omitted, the default cache is used.
 * @param init.getKey Optional function to compute a custom cache key from a request.
 *
 * @returns A `Middleware` instance that can be used in a Worker pipeline.
 */
export function cache(init: Partial<CacheInit> = {}): Middleware {
    assertCacheInit(init);

    return new CacheHandler(init);
}

/**
 * Cache Middleware Implementation
 * @see {@link cache}
 */
class CacheHandler implements Middleware {
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

        this.setCached(cache, worker, response);
        return response;
    }

    /**
     * Retrieves a cached response for a given request.
     * - Checks both the base cache key and any Vary-specific keys.
     *
     * @param cache The Cache object to check.
     * @param request The request to retrieve a cached response for.
     * @returns A cached Response if available, otherwise `undefined`.
     */
    public async getCached(cache: Cache, request: Request): Promise<Response | undefined> {
        const url = this.getCacheKey(request);
        const response = await cache.match(url);
        if (!response) return undefined;

        const vary = this.getFilteredVary(response);
        if (vary.length === 0) return response;

        const key = getVaryKey(request, vary, url);
        return cache.match(key);
    }

    /**
     * Caches a response if it is cacheable.
     *
     * Behavior:
     * - Always stores the response under the main cache key. This ensures that
     *   the response’s Vary headers are available for later cache lookups.
     * - If the response varies based on certain request headers (per the Vary header),
     *   also stores a copy under a Vary-specific cache key so future requests
     *   with matching headers can retrieve the correct response.
     *
     * @param cache The Cache object to store the response in.
     * @param worker The Worker instance containing the request and context.
     * @param response The Response to cache.
     */
    public async setCached(cache: Cache, worker: Worker, response: Response): Promise<void> {
        if (!isCacheable(worker.request, response)) return;

        const url = this.getCacheKey(worker.request);

        // Always store the main cache entry to preserve Vary headers
        worker.ctx.waitUntil(cache.put(url, response.clone()));

        // Store request-specific cache entry if the response varies
        const vary = this.getFilteredVary(response);
        if (vary.length > 0) {
            worker.ctx.waitUntil(
                cache.put(getVaryKey(worker.request, vary, url), response.clone()),
            );
        }
    }

    /**
     * Extracts and filters the `Vary` header from a response.
     *
     * @param response - The HTTP response to inspect.
     * @returns An array of filtered header names from the `Vary` header.
     */
    public getFilteredVary(response: Response): string[] {
        return filterVaryHeader(getVaryHeader(response));
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
