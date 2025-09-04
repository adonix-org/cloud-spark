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

export class CacheHandler extends Middleware {
    constructor(
        protected readonly cacheName?: string,
        protected readonly getKey?: (request: Request) => URL | RequestInfo,
    ) {
        super();
    }

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

    public getCacheKey(request: Request): URL | RequestInfo {
        return this.getKey ? this.getKey(request) : normalizeUrl(request.url);
    }
}
