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
import { GET, HttpHeader } from "../../constants/http";
import { assertCacheName, assertGetKey } from "../../guards/cache";
import { VARY_WILDCARD } from "./constants";
import { isCacheable } from "./utils";

export function cache(
    cacheName?: string,
    getKey?: (request: Request) => URL | RequestInfo,
): Middleware {
    assertCacheName(cacheName);
    assertGetKey(getKey);

    return new CacheHandler(cacheName, getKey);
}

class CacheHandler extends Middleware {
    constructor(
        protected readonly cacheName?: string,
        protected readonly getKey?: (request: Request) => URL | RequestInfo,
    ) {
        super();
    }

    public override async handle(worker: Worker, next: () => Promise<Response>): Promise<Response> {
        const cache = this.cacheName ? await caches.open(this.cacheName) : caches.default;

        if (worker.request.method !== GET) {
            return next();
        }

        const cached = await cache.match(this.getCacheKey(worker.request));
        if (cached) {
            const vary = cached.headers.get(HttpHeader.VARY);
            // Check Vary Header from cached response
            // If Vary not present, return response directly from cache
            if (!vary) {
                return cached;
            }
            // If Vary header present, use cached Vary header to build base64 key from matching Vary
            // request header and values. (Ignore Accept-Encoding)
            // Look for generated base64 key in cache, if found pass it back immediately
            // If not found, continue
        }

        const response = await next();

        if (!isCacheable(response)) return response;

        const vary = response.headers.get(HttpHeader.VARY);
        if (vary && vary !== VARY_WILDCARD) {
            // Cache the response with the normalied URL, Vary Header
            worker.ctx.waitUntil(cache.put(this.getCacheKey(worker.request), response.clone()));
            // Cache the response with the generated base64 key
            worker.ctx.waitUntil(cache.put(this.getCacheKey(worker.request), response.clone()));
        } else {
            // Cache the response with the normalied URL
            worker.ctx.waitUntil(cache.put(this.getCacheKey(worker.request), response.clone()));
        }
        return response;
    }

    private getCacheKey(request: Request): URL | RequestInfo {
        return this.getKey ? this.getKey(request) : request;
    }
}
