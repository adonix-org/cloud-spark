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
import { isNotModified, isPreconditionFailed } from "./utils";
import { ValidationRule } from "./validation";

abstract class MatchRule extends ValidationRule<string> {
    protected override getHeader(response: Response): string | undefined {
        return response.headers.get(HttpHeader.ETAG) ?? undefined;
    }
}

export class IfMatchRule extends MatchRule {
    protected async response(
        response: Response,
        etag: string,
        validators: CacheValidators,
    ): Promise<Response | undefined> {
        if (isPreconditionFailed(validators.ifMatch, etag)) {
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
        if (validators.ifNoneMatch.length === 0) return response;

        if (isNotModified(validators.ifNoneMatch, etag)) {
            return new NotModified(response).response();
        }

        return undefined;
    }
}
