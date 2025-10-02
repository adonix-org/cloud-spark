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
import { PreconditionFailed } from "../../../errors";
import { Worker } from "../../../interfaces";
import { NotModified } from "../../../responses";
import { getHeaderValues } from "../../../utils/headers";
import { CacheRule } from "./interfaces";

export class ETagRule implements CacheRule {
    public async handle(
        worker: Worker,
        next: () => Promise<Response>,
    ): Promise<Response | undefined> {
        const response = await next();
        if (!response) return undefined;

        const etag = response.headers.get(HttpHeader.ETAG);
        if (!etag) return response;

        const ifNoneMatch = getHeaderValues(worker.request.headers, HttpHeader.IF_NONE_MATCH);
        const ifMatch = getHeaderValues(worker.request.headers, HttpHeader.IF_MATCH);

        // If-Match
        if (ifMatch.length > 0) {
            if (ifMatch.includes("*")) {
                if (!response) {
                    return new PreconditionFailed().response();
                }
            } else if (!ifMatch.map(normalizeStrong).includes(normalizeStrong(etag))) {
                return new PreconditionFailed().response();
            }
        }

        // If-None-Match (weak compare or wildcard)
        if (ifNoneMatch.length > 0) {
            if (
                ifNoneMatch.includes("*") ||
                ifNoneMatch.map(normalizeWeak).includes(normalizeWeak(etag))
            ) {
                return new NotModified(response).response();
            }

            // ETags exist but don't match → cache can't be used
            return undefined;
        }

        return response;
    }
}

/**
 * Normalizes an ETag string for weak comparison.
 * - Strips the weak prefix "W/" if present.
 */
function normalizeWeak(etag: string): string {
    return etag.startsWith("W/") ? etag.slice(2) : etag;
}

/**
 * Normalizes an ETag string for strong comparison.
 * - Leaves strong ETags unchanged.
 * - Weak ETags are NOT equivalent to strong ones.
 */
function normalizeStrong(etag: string): string {
    return etag;
}
