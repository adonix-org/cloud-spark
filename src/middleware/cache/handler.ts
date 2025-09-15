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
import { getVaryFiltered, getVaryHeader, getVaryKey, isCacheable } from "./utils";

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

    private async getCached(cache: Cache, request: Request): Promise<Response | undefined> {
        const response = await cache.match(this.getCacheKey(request));
        if (!response) return;

        const vary = this.getFilteredVary(response);
        if (vary.length === 0) return response;

        const key = getVaryKey(request, vary);
        return cache.match(key);
    }

    private async setCached(cache: Cache, worker: Worker, response: Response): Promise<void> {
        if (!isCacheable(response)) return;

        worker.ctx.waitUntil(cache.put(this.getCacheKey(worker.request), response.clone()));

        const vary = this.getFilteredVary(response);
        if (vary.length !== 0) {
            worker.ctx.waitUntil(cache.put(getVaryKey(worker.request, vary), response.clone()));
        }
    }

    private getFilteredVary(response: Response) {
        return getVaryFiltered(getVaryHeader(response));
    }

    private getCacheKey(request: Request): URL | RequestInfo {
        return this.getKey ? this.getKey(request) : request;
    }
}
