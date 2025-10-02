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

import { Worker } from "../../../interfaces";
import { HttpHeader } from "../../../constants/headers";
import { PreconditionFailed } from "../../../errors";
import { NotModified } from "../../../responses";
import { getHeaderValues } from "../../../utils/headers";
import { CacheRule } from "./interfaces";
import { normalizeStrong, normalizeWeak } from "./utils";

/**
 * Cache rule that handles conditional GETs based on ETag headers.
 * - Applies If-Match (strong comparison) and If-None-Match (weak comparison) rules.
 * - Returns `undefined` if the cached response cannot be used.
 * - Returns `NotModified` or `PreconditionFailed` responses when appropriate.
 */
export class ETagRule implements CacheRule {
    public async handle(
        worker: Worker,
        next: () => Promise<Response>,
    ): Promise<Response | undefined> {
        const response = await next();

        const etag = response.headers.get(HttpHeader.ETAG);
        if (!etag) return response;

        const ifNoneMatch = getHeaderValues(worker.request.headers, HttpHeader.IF_NONE_MATCH);
        const ifMatch = getHeaderValues(worker.request.headers, HttpHeader.IF_MATCH);

        // If-Match (strong comparison)
        if (ifMatch.length > 0 && !ifMatch.includes("*")) {
            const normalizedEtag = normalizeStrong(etag);
            const normalizedMatches = ifMatch.map(normalizeStrong);
            if (!normalizedMatches.includes(normalizedEtag)) {
                return new PreconditionFailed().response();
            }
        }

        // If-None-Match (weak comparison or wildcard)
        if (ifNoneMatch.length > 0) {
            const normalizedEtag = normalizeWeak(etag);
            const normalizedMatches = ifNoneMatch.map(normalizeWeak);
            if (ifNoneMatch.includes("*") || normalizedMatches.includes(normalizedEtag)) {
                return new NotModified(response).response();
            }

            // ETags exist but don't match → cache cannot be used
            return undefined;
        }

        return response;
    }
}
