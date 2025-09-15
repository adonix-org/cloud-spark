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

import { Middleware } from "../middleware";
import { Worker } from "../../interfaces/worker";
import { GET } from "../../constants/http";
import { assertCacheName, assertGetKey } from "../../guards/cache";
import { getVaryHeader, getVaryKey, isCacheable } from "./utils";
import { normalizeUrl } from "../../utils/url";

/**
 * Creates a Vary-aware caching middleware for Workers.
 *
 * This middleware:
 * - Caches **GET requests** only.
 * - Respects the `Vary` header of responses, ensuring that requests
 *   with different headers (e.g., `Origin`) receive the correct cached response.
 * - Skips caching for non-cacheable responses (e.g., error responses or
 *   responses with `Vary: *`).
 *
 * @param cacheName Optional name of the cache to use. If omitted, the default Worker cache is used.
 * @param getKey Optional function to compute a custom cache key from a request.
 *               If omitted, the request URL is normalized and used as the key.
 * @returns A `Middleware` instance that can be used in a Worker pipeline.
 */
export function cache(cacheName?: string, getKey?: (request: Request) => URL): Middleware {
    assertCacheName(cacheName);
    assertGetKey(getKey);

    return new CacheHandler(cacheName, getKey);
}

/**
 * Cache Middleware Implementation
 * @see {@link cache}
 */
class CacheHandler extends Middleware {
    constructor(
        protected readonly cacheName?: string,
        protected readonly getKey?: (request: Request) => URL,
    ) {
        super();
    }

    /**
     * Handles an incoming request.
     * - Bypasses caching for non-GET requests.
     * - Checks the cache for a stored response.
     * - Calls the next middleware or origin if no cached response exists.
     * - Caches the response if it is cacheable.
     *
     * @param worker The Worker instance containing the request and context.
     * @param next Function to call the next middleware or origin fetch.
     * @returns A cached or freshly fetched Response.
     */
    public override async handle(worker: Worker, next: () => Promise<Response>): Promise<Response> {
        if (worker.request.method !== GET) {
            return next();
        }

        const cache = this.cacheName ? await caches.open(this.cacheName) : caches.default;
        const cached = await this.getCached(cache, worker.request);
        if (cached) return cached;

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
        if (!response) return;

        const vary = getVaryHeader(response);
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
        if (!isCacheable(response)) return;

        const url = this.getCacheKey(worker.request);

        // Always store the main cache entry to preserve Vary headers
        worker.ctx.waitUntil(cache.put(url, response.clone()));

        // Store request-specific cache entry if the response varies
        const vary = getVaryHeader(response);
        if (vary.length !== 0) {
            worker.ctx.waitUntil(
                cache.put(getVaryKey(worker.request, vary, url), response.clone()),
            );
        }
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
        return this.getKey ? this.getKey(request) : normalizeUrl(request.url);
    }
}
