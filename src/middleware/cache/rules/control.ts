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

import { Worker } from "../../../core";
import { getCacheControl } from "../utils";

import { CacheRule } from "./interfaces";
import { hasCacheValidator } from "./utils";

/**
 * Determines cache eligibility based on request `Cache-Control` headers.
 *
 * - `no-store` always prevents using the cache.
 * - `no-cache` or `max-age=0` prevent using the cache **unless** conditional validators
 *   (e.g., `If-None-Match`, `If-Modified-Since`) are present.
 * - Otherwise, the request passes to the next rule in the chain.
 */
export class CacheControlRule implements CacheRule {
    /**
     * Applies cache-control header validation to determine cache usability.
     *
     * @param worker - The worker context containing the request.
     * @param next - Function invoking the next cache rule or returning a cached response.
     * @returns The cached response if allowed by cache-control, or `undefined` if the cache cannot be used.
     */
    public async apply(
        worker: Worker,
        next: () => Promise<Response | undefined>,
    ): Promise<Response | undefined> {
        const cache = getCacheControl(worker.request.headers);

        if (cache["no-store"]) {
            return undefined;
        }

        if (
            (cache["no-cache"] || cache["max-age"] === 0) &&
            !hasCacheValidator(worker.request.headers)
        ) {
            return undefined;
        }

        return next();
    }
}
