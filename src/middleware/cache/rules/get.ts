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

import { GET, HEAD, StatusCodes } from "../../../constants";
import { Worker } from "../../../interfaces";
import { Head } from "../../../responses";
import { CacheRule } from "./interfaces";

export class GetMethodRule implements CacheRule {
    public async apply(
        worker: Worker,
        next: () => Promise<Response | undefined>,
    ): Promise<Response | undefined> {
        if (worker.request.method === GET) {
            return next();
        }

        if (worker.request.method === HEAD) {
            const response = await next();
            if (!response || response.status !== StatusCodes.OK) return response;

            return new Head(response).response();
        }

        return undefined;
    }
}
