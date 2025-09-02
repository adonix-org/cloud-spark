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

import { Method, normalizeUrl } from "./common";
import { Cors } from "./cors";
import { Middleware } from "./middleware";
import { Worker } from "./worker";

export class CacheWorker extends Middleware {
    protected override async pre(worker: Worker): Promise<void | Response> {
        if (worker.request.method !== Method.GET) return;

        const cached = await caches.default.match(this.getCacheKey(worker.request));
        if (cached) return cached;
    }

    protected override async post(worker: Worker, response: Response): Promise<void> {
        if (!response.ok || worker.request.method !== Method.GET) return;

        worker.ctx.waitUntil(
            caches.default.put(
                this.getCacheKey(worker.request),
                this.removeCacheHeaders(response.clone())
            )
        );
    }

    /**
     * Returns the cache key for the request.
     *
     * Behavior:
     * - By default, returns the normalized request URL.
     * - Query parameters are normalized so that the order does not affect the cache key.
     *   For example, `?a=1&b=2` and `?b=2&a=1` produce the same cache key.
     *
     * @returns {URL | RequestInfo} The URL or RequestInfo used as the cache key.
     */
    public getCacheKey(request: Request): URL | RequestInfo {
        return normalizeUrl(request.url);
    }

    /**
     * Removes headers that should not be stored in the cache (currently only CORS headers).
     *
     * @param {Response} response The Response to clean before caching.
     * @returns {Response} A new Response with excluded headers removed.
     * @see {@link addCacheHeaders}
     */
    public removeCacheHeaders(response: Response): Response {
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
    public excludeCacheHeaders(): string[] {
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
