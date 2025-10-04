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

import { StatusCodes } from "http-status-codes";
import { Worker } from "../../../interfaces";
import { CacheRule, CacheValidators } from "./interfaces";
import { getCacheValidators } from "./utils";

export abstract class ValidationRule<H> implements CacheRule {
    protected abstract getHeader(response: Response): H | undefined;

    protected abstract response(
        response: Response,
        header: H,
        validators: CacheValidators,
    ): Promise<Response | undefined>;

    public async apply(
        worker: Worker,
        next: () => Promise<Response | undefined>,
    ): Promise<Response | undefined> {
        const response = await next();
        if (!response || response.status !== StatusCodes.OK) return response;

        const header = this.getHeader(response);
        if (!header) return response;

        const validators = getCacheValidators(worker.request.headers);
        return this.response(response, header, validators);
    }
}
