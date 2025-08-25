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

import { Method, normalizeUrl, toBase64 } from "./common";
import { BaseWorker } from "./base-worker";

export abstract class CacheWorker extends BaseWorker {
    protected getCacheKey(...values: Array<string | null | undefined>): URL | RequestInfo {
        const raw = [
            normalizeUrl(this.request.url),
            ...values
                .filter((v) => v != null) // remove null/undefined
                .map((v) => v!.trim()) // trim whitespace
                .filter((v) => v.length > 0), // skip empty strings after trim
        ].join("\u0001");
        const base64 = toBase64(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        return new URL(`http://cache/${base64}`);
    }

    protected async getCachedResponse(cacheName?: string): Promise<Response | undefined> {
        if (this.request.method !== Method.GET) return;

        const cache = cacheName ? await caches.open(cacheName) : caches.default;
        return cache.match(this.getCacheKey());
    }

    protected async setCachedResponse(response: Response, cacheName?: string): Promise<void> {
        if (!response.ok) return;
        if (this.request.method !== Method.GET) return;

        const cache = cacheName ? await caches.open(cacheName) : caches.default;
        this.ctx?.waitUntil(cache.put(this.getCacheKey(), response.clone()));
    }
}
