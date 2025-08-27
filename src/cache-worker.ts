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

import { HttpHeader, Method, normalizeUrl } from "./common";
import { addCorsHeaders, Cors } from "./cors";
import { CorsWorker } from "./cors-worker";

/**
 * Abstract base class for Workers that support caching of GET responses.
 *
 * Features:
 * - URL-based caching using `Request.url`.
 * - Removes per-request CORS headers before storing in cache.
 * - Dynamically applies correct CORS headers when retrieving cached responses.
 * - Only caches successful GET requests.
 */
export abstract class CacheWorker extends CorsWorker {
    /**
     * Returns the cache key for the current request.
     * By default, this is the normalized request URL.
     *
     * @returns A URL or RequestInfo to use as the cache key
     */
    protected getCacheKey(): URL | RequestInfo {
        return normalizeUrl(this.request.url);
    }

    /**
     * Retrieves a cached Response for the current request, if one exists.
     *
     * Behavior:
     * - Only GET requests are cached.
     * - If a cached response is found, CORS headers are applied dynamically
     *   using `withCorsHeaders` before returning.
     * - Returns undefined if no cached response is found or if request is not GET.
     *
     * @param cacheName Optional name of the cache to use; defaults to `caches.default`.
     * @returns A Promise resolving to a Response with correct CORS headers, or undefined.
     *
     * @see {@link getCacheKey}
     * @see {@link setCachedResponse}
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
     * - Removes all CORS headers before storing using `withoutCorsHeaders`.
     * - Uses `ctx.waitUntil` to store asynchronously without blocking the worker.
     *
     * @param response The Response to cache
     * @param cacheName Optional name of the cache to use; defaults to `caches.default`.
     *
     * @see {@link getCacheKey}
     * @see {@link getCachedResponse}
     */
    protected async setCachedResponse(response: Response, cacheName?: string): Promise<void> {
        if (!response.ok) return;
        if (this.request.method !== Method.GET) return;

        const cache = cacheName ? await caches.open(cacheName) : caches.default;
        this.ctx?.waitUntil(
            cache.put(this.getCacheKey(), this.removeCacheHeaders(response.clone()))
        );
    }

    protected addCacheHeaders(cached: Response): Response {
        const headers = new Headers(cached.headers);
        addCorsHeaders(this, headers);
        headers.set(HttpHeader.X_CACHE_STATUS, HttpHeader.CACHE_HIT);

        return new Response(cached.body, {
            status: cached.status,
            statusText: cached.statusText,
            headers,
        });
    }

    protected removeCacheHeaders(response: Response): Response {
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

    protected excludeCacheHeaders(): string[] {
        return [
            Cors.ALLOW_ORIGIN,
            Cors.ALLOW_CREDENTIALS,
            Cors.EXPOSE_HEADERS,
            Cors.ALLOW_METHODS,
            Cors.MAX_AGE,
            HttpHeader.AGE,
            HttpHeader.DATE,
            HttpHeader.EXPIRES,
            HttpHeader.CONNECTION,
            HttpHeader.TRANSFER_ENCODING,
            HttpHeader.CF_CACHE_STATUS,
        ];
    }
}
