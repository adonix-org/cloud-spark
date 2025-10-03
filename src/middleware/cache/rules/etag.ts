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
import { PreconditionFailed } from "../../../errors";
import { NotModified } from "../../../responses";
import { CacheRule } from "./interfaces";
import { getCacheValidators, getEtag, isPreconditionFailed, isNotModified } from "./utils";

/**
 * Cache rule that handles conditional GETs based on ETag headers.
 * - Applies If-Match (strong comparison) and If-None-Match (weak comparison) rules.
 * - Returns `undefined` if the cached response cannot be used.
 * - Returns `NotModified` or `PreconditionFailed` responses when appropriate.
 */
export class ETagRule implements CacheRule {
    public async apply(
        worker: Worker,
        next: () => Promise<Response>,
    ): Promise<Response | undefined> {
        const response = await next();

        const etag = getEtag(response);
        if (!etag) return response;

        const { ifMatch, ifNoneMatch } = getCacheValidators(worker.request.headers);
        if (ifMatch.length === 0 && ifNoneMatch.length === 0) return response;

        if (isPreconditionFailed(ifMatch, etag)) {
            return new PreconditionFailed().response();
        }

        if (ifNoneMatch.length > 0) {
            if (isNotModified(ifNoneMatch, etag)) {
                return new NotModified(response).response();
            }

            return undefined;
        }

        return response;
    }
}
