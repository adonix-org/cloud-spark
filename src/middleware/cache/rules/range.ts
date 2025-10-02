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
import { isNumber } from "../../../guards/basic";
import { Worker } from "../../../interfaces/worker";
import { CacheRule } from "./interfaces";
import { getRange } from "./utils";

export class RangeRule implements CacheRule {
    public async handle(
        worker: Worker,
        next: () => Promise<Response>,
    ): Promise<Response | undefined> {
        const range = getRange(worker.request);

        if (range && (range.start !== 0 || range.end === 0)) {
            return undefined;
        }

        const response = await next();

        if (!range) return response;
        if (range.end === undefined) return response;

        // Validate response length
        const lengthHeader = response.headers.get(HttpHeader.CONTENT_LENGTH);
        const length = Number(lengthHeader);
        if (!isNumber(length) || range.end >= length) return undefined;

        return response;
    }
}
