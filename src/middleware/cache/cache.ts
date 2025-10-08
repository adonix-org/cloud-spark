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

import { assertCacheInit } from "../../guards/cache";
import { CacheInit } from "../../interfaces/cache";
import { Middleware } from "../../interfaces/middleware";
import { CacheHandler } from "./handler";

/**
 * Creates a Vary-aware caching middleware for Workers.
 *
 * This middleware:
 * - Caches `GET` requests **only**.
 * - Respects the `Vary` header of responses, ensuring that requests
 *   with different headers (e.g., `Origin`) receive the correct cached response.
 * - Skips caching for non-cacheable responses (e.g., error responses or
 *   responses with `Vary: *`).
 *
 * @param init Optional cache configuration object.
 * @param init.name Optional name of the cache to use. If omitted, the default cache is used.
 * @param init.getKey Optional function to compute a custom cache key from a request.
 *
 * @returns A `Middleware` instance that can be used in a Worker pipeline.
 */
export function cache(init: Partial<CacheInit> = {}): Middleware {
    assertCacheInit(init);

    return new CacheHandler(init);
}
