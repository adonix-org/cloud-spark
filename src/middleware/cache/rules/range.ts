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
import { Worker } from "../../../interfaces/worker";
import { CacheRule } from "./interfaces";
import { getContentLength, getRange } from "./utils";

export class RangeRule implements CacheRule {
    public async apply(
        worker: Worker,
        next: () => Promise<Response | undefined>,
    ): Promise<Response | undefined> {
        const range = getRange(worker.request);

        if (range && (range.start !== 0 || range.end === 0)) {
            return undefined;
        }

        const response = await next();
        if (!response || response.status !== StatusCodes.OK) return response;

        if (!range) return response;
        if (range.end === undefined) return response;

        const length = getContentLength(response.headers);
        if (!length) return undefined;
        if (range.end !== length - 1) return undefined;

        return response;
    }
}
