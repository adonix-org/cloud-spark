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
import { withCorsHeaders, withoutCorsHeaders } from "./cors";
import { CorsWorker } from "./cors-worker";

export abstract class CacheWorker extends CorsWorker {
    protected getCacheKey(): URL | RequestInfo {
        return normalizeUrl(this.request.url);
    }

    protected async getCachedResponse(cacheName?: string): Promise<Response | undefined> {
        if (this.request.method !== Method.GET) return;

        const cache = cacheName ? await caches.open(cacheName) : caches.default;

        const response = await cache.match(this.getCacheKey());
        return response ? withCorsHeaders(this, response) : undefined;
    }

    protected async setCachedResponse(response: Response, cacheName?: string): Promise<void> {
        if (!response.ok) return;
        if (this.request.method !== Method.GET) return;

        const cache = cacheName ? await caches.open(cacheName) : caches.default;
        this.ctx?.waitUntil(cache.put(this.getCacheKey(), withoutCorsHeaders(response)));
    }
}
