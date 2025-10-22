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

import { HttpHeader } from "../../../constants/headers";
import { Worker } from "../../../interfaces";

import { CacheRule } from "./interfaces";

/**
 * Prevents using the cache for requests that contain sensitive headers.
 *
 * - Requests with `Authorization` or `Cookie` headers bypass the cache.
 * - Otherwise, the request passes to the next rule in the chain.
 */
export class SecurityRule implements CacheRule {
    /**
     * Applies security-based cache validation.
     *
     * @param worker - The worker context containing the request.
     * @param next - Function invoking the next cache rule or returning a cached response.
     * @returns The cached response if allowed, or `undefined` if the cache cannot be used.
     */
    public async apply(
        worker: Worker,
        next: () => Promise<Response | undefined>,
    ): Promise<Response | undefined> {
        const headers = worker.request.headers;
        if (headers.has(HttpHeader.AUTHORIZATION)) {
            return undefined;
        }
        if (headers.has(HttpHeader.COOKIE)) {
            return undefined;
        }

        return next();
    }
}
