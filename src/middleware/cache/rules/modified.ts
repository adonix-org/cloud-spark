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
import { NotModified } from "../../../responses";

import { CacheValidators } from "./interfaces";
import { toDate } from "./utils";
import { ValidationRule } from "./validation";

abstract class LastModifiedRule extends ValidationRule<number> {
    protected override getHeader(response: Response): number | undefined {
        return toDate(response.headers.get(HttpHeader.LAST_MODIFIED));
    }
}

export class ModifiedSinceRule extends LastModifiedRule {
    protected async response(
        response: Response,
        lastModified: number,
        validators: CacheValidators,
    ): Promise<Response | undefined> {
        const modifiedSince = toDate(validators.ifModifiedSince);
        if (modifiedSince === undefined) return response;

        if (lastModified <= modifiedSince) return new NotModified(response).response();

        return undefined;
    }
}

export class UnmodifiedSinceRule extends LastModifiedRule {
    protected async response(
        response: Response,
        lastModified: number,
        validators: CacheValidators,
    ): Promise<Response | undefined> {
        const unmodifiedSince = toDate(validators.ifUnmodifiedSince);
        if (unmodifiedSince === undefined) return response;

        if (lastModified > unmodifiedSince) {
            return new PreconditionFailed(
                `Last-Modified: ${new Date(lastModified).toUTCString()}`,
            ).response();
        }

        return response;
    }
}
