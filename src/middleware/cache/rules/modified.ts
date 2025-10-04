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

import { StatusCodes } from "../../../constants";
import { HttpHeader } from "../../../constants/headers";
import { PreconditionFailed } from "../../../errors";
import { Worker } from "../../../interfaces/worker";
import { NotModified } from "../../../responses";
import { CacheRule } from "./interfaces";
import { getCacheValidators } from "./utils";

type SinceValidatorKeys = "ifModifiedSince" | "ifUnmodifiedSince";

abstract class SinceRule implements CacheRule {
    // Let the literal type be inferred from the value we assign in the subclass
    abstract requestHeader: SinceValidatorKeys;
    abstract compare(lastModified: number, headerTime: number): boolean;
    abstract onFail(response: Response | undefined): Response | Promise<Response>;

    public async apply(
        worker: Worker,
        next: () => Promise<Response | undefined>,
    ): Promise<Response | undefined> {
        const response = await next();
        if (!response || response.status !== StatusCodes.OK) return response;

        const lastModified = response.headers.get(HttpHeader.LAST_MODIFIED);
        if (!lastModified) return response;

        const lastModifiedTime = Date.parse(lastModified);
        if (isNaN(lastModifiedTime)) return response;

        const validators = getCacheValidators(worker.request.headers);
        const headerValue = validators[this.requestHeader];
        if (headerValue) {
            const headerTime = Date.parse(headerValue);
            if (!isNaN(headerTime) && this.compare(lastModifiedTime, headerTime)) {
                return await this.onFail(response); // supports async onFail if needed
            }
        }

        return response;
    }
}

export class UnmodifiedSinceRule extends SinceRule {
    requestHeader: "ifUnmodifiedSince" = "ifUnmodifiedSince";
    compare = (lastModified: number, headerTime: number) => lastModified > headerTime;
    onFail = () => new PreconditionFailed().response();
}

export class ModifiedSinceRule extends SinceRule {
    requestHeader: "ifModifiedSince" = "ifModifiedSince";
    compare = (lastModified: number, headerTime: number) => lastModified <= headerTime;
    onFail = (response: Response) => new NotModified(response).response();
}
