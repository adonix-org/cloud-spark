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
import { Middleware } from "./middleware";
import { Worker } from "./worker";

export class CacheHandler extends Middleware {
    constructor(protected readonly cacheName?: string) {
        super();
    }

    public override async handle(worker: Worker, next: () => Promise<Response>): Promise<Response> {
        const cache = this.cacheName ? await caches.open(this.cacheName) : caches.default;

        if (worker.request.method === Method.GET) {
            const cached = await cache.match(this.getCacheKey(worker.request));
            if (cached) return cached;
        }

        const response = await next();

        if (response.ok && worker.request.method === Method.GET) {
            worker.ctx.waitUntil(cache.put(this.getCacheKey(worker.request), response.clone()));
        }
        return response;
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
}
