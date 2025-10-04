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

import { PreconditionFailed } from "../../../errors";
import { NotModified } from "../../../responses";
import { CacheValidators } from "./interfaces";
import { isPreconditionFailed, isNotModified } from "./utils";
import { ValidationRule } from "./validation";
import { HttpHeader } from "../../../constants/headers";

abstract class MatchRule extends ValidationRule {
    protected get key(): string {
        return HttpHeader.ETAG;
    }
}

export class IfMatchRule extends MatchRule {
    protected async response(
        response: Response,
        etag: string,
        validators: CacheValidators,
    ): Promise<Response | undefined> {
        const ifMatch = validators.ifMatch;
        if (ifMatch.length === 0) return response;

        if (isPreconditionFailed(ifMatch, etag)) {
            return new PreconditionFailed(`ETag: ${etag}`).response();
        }

        return response;
    }
}

export class IfNoneMatchRule extends MatchRule {
    protected async response(
        response: Response,
        etag: string,
        validators: CacheValidators,
    ): Promise<Response | undefined> {
        const ifNoneMatch = validators.ifNoneMatch;
        if (ifNoneMatch.length === 0) return response;

        if (isNotModified(ifNoneMatch, etag)) {
            return new NotModified(response).response();
        }

        return undefined;
    }
}
