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

import { Method, normalizeUrl } from "../../common";
import { Middleware } from "../middleware";
import { Worker } from "../../interfaces/worker";

/**
 * Middleware for caching GET requests.
 *
 * This middleware checks a cache (either a named cache or the default)
 * before passing the request down the middleware chain. Responses for
 * successful GET requests are automatically stored in the cache.
 *
 * Non-GET requests are never cached. The cache key can be customized
 * via the `getKey` function; otherwise, the URL is normalized and used.
 *
 * Example usage:
 * ```ts
 * const cacheMiddleware = new CacheHandler("my-cache", (req) => new URL(req.url));
 * worker.use(cacheMiddleware);
 * ```
 */
export class CacheHandler extends Middleware {
    /**
     * @param cacheName - Optional name of the cache to use. If omitted,
     *                    `caches.default` is used.
     * @param getKey - Optional function to generate a cache key from a request.
     *                 Defaults to using the normalized request URL.
     */
    constructor(
        protected readonly cacheName?: string,
        protected readonly getKey?: (request: Request) => URL | RequestInfo,
    ) {
        super();
    }

    /**
     * Handle a request in the caching middleware.
     *
     * Checks the cache for GET requests and returns the cached response if available.
     * Otherwise, calls `next()` to continue the middleware chain and caches
     * the response if successful.
     *
     * @param worker - The Worker instance containing the request context.
     * @param next - Function to invoke the next middleware in the chain.
     * @returns A Response object, either from cache or the next middleware.
     */
    public override async handle(worker: Worker, next: () => Promise<Response>): Promise<Response> {
        const cache = this.cacheName ? await caches.open(this.cacheName) : caches.default;

        if (worker.request.method === Method.GET) {
            const cached = await cache.match(this.getCacheKey(worker.request));
            if (cached) return cached;
        }

        const response = await next();

        if (worker.request.method === Method.GET && response.ok) {
            worker.ctx.waitUntil(cache.put(this.getCacheKey(worker.request), response.clone()));
        }
        return response;
    }

    /**
     * Generate the cache key for a request.
     *
     * @param request - The Request object to generate a cache key for.
     * @returns A URL or RequestInfo used as the cache key.
     *
     * If a custom `getKey` function was provided in the constructor, it is used.
     * Otherwise, the request URL is normalized.
     */
    public getCacheKey(request: Request): URL | RequestInfo {
        return this.getKey ? this.getKey(request) : normalizeUrl(request.url);
    }
}
