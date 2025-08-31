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

import { getOrigin, Method, normalizeUrl } from "./common";
import { addCorsHeaders, Cors } from "./cors";
import { CorsDefaults } from "./cors-defaults";

/**
 * Abstract worker class that adds caching support for GET requests.
 *
 * Behavior:
 * - Caches successful GET responses (`response.ok === true`) in the selected cache.
 * - Strips CORS headers from cached responses; all other origin headers are preserved.
 * - Dynamically adds CORS headers to cached responses when returned to the client.
 *
 * Subclasses should override `getCacheKey()` to customize cache key generation if needed.
 */
export abstract class CacheWorker extends CorsDefaults {
    /**
     * Returns the cache key for the current request.
     *
     * Behavior:
     * - By default, returns the normalized request URL.
     * - Query parameters are normalized so that the order does not affect the cache key.
     *   For example, `?a=1&b=2` and `?b=2&a=1` produce the same cache key.
     *
     * Subclasses may override this method to implement custom cache key strategies.
     *
     * @returns {URL | RequestInfo} The URL or RequestInfo used as the cache key.
     */
    protected getCacheKey(): URL | RequestInfo {
        return normalizeUrl(this.request.url);
    }

    /**
     * Retrieves a cached Response for the current request, if one exists.
     *
     * Behavior:
     * - Only GET requests are considered.
     * - Returns a new Response with dynamic CORS headers applied via `addCacheHeaders`.
     * - Returns `undefined` if no cached response is found.
     * - Cloudflare dynamic headers (`CF-Cache-Status`, `Age`, `Connection`, etc.) will
     *   always be present on the returned response, even though they are not stored in the cache.
     *
     * @param {string} [cacheName] Optional named cache; defaults to `caches.default`.
     * @returns {Promise<Response | undefined>} A Response with CORS headers, or undefined.
     * @see {@link setCachedResponse}
     * @see {@link getCacheKey}
     */
    protected async getCachedResponse(cacheName?: string): Promise<Response | undefined> {
        if (this.request.method !== Method.GET) return;

        const cache = cacheName ? await caches.open(cacheName) : caches.default;
        const response = await cache.match(this.getCacheKey());
        return response ? this.addCacheHeaders(response) : undefined;
    }

    /**
     * Stores a Response in the cache for the current request.
     *
     * Behavior:
     * - Only caches successful GET responses (`response.ok === true`).
     * - Strips headers via `removeCacheHeaders` before storing.
     * - Uses `ctx.waitUntil` to perform caching asynchronously without blocking the response.
     * - All other origin headers (e.g., Cache-Control, Expires) are preserved.
     *
     * @param {Response} response The Response to cache.
     * @param {string} [cacheName] Optional named cache; defaults to `caches.default`.
     * @see {@link getCachedResponse}
     * @see {@link getCacheKey}
     */
    protected async setCachedResponse(response: Response, cacheName?: string): Promise<void> {
        if (!response.ok) return;
        if (this.request.method !== Method.GET) return;

        const cache = cacheName ? await caches.open(cacheName) : caches.default;
        this.ctx.waitUntil(
            cache.put(this.getCacheKey(), this.removeCacheHeaders(response.clone()))
        );
    }

    /**
     * Adds headers to a cached response.
     *
     * @param {Response} cached The cached Response.
     * @returns {Response} A new Response with dynamic CORS headers applied.
     * @see {@link removeCacheHeaders}
     */
    protected addCacheHeaders(cached: Response): Response {
        const headers = new Headers(cached.headers);
        addCorsHeaders(getOrigin(this.request), this, headers);

        return new Response(cached.body, {
            status: cached.status,
            statusText: cached.statusText,
            headers,
        });
    }

    /**
     * Removes headers that should not be stored in the cache (currently only CORS headers).
     *
     * @param {Response} response The Response to clean before caching.
     * @returns {Response} A new Response with excluded headers removed.
     * @see {@link addCacheHeaders}
     */
    private removeCacheHeaders(response: Response): Response {
        const excludeSet = new Set(this.excludeCacheHeaders().map((h) => h.toLowerCase()));
        const headers = new Headers();

        for (const [key, value] of response.headers) {
            if (!excludeSet.has(key)) {
                headers.set(key, value);
            }
        }

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    }

    /**
     * Returns the list of headers to exclude from the cached response.
     * By default, excludes only dynamic CORS headers.
     *
     * @returns {string[]} Array of header names to exclude.
     * @see {@link removeCacheHeaders}
     */
    protected excludeCacheHeaders(): string[] {
        return [
            Cors.ALLOW_ORIGIN,
            Cors.ALLOW_CREDENTIALS,
            Cors.EXPOSE_HEADERS,
            Cors.ALLOW_METHODS,
            Cors.ALLOW_HEADERS,
            Cors.MAX_AGE,
        ];
    }
}
