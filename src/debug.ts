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
import { WorkerBase } from "./base";
import { WorkerResult } from "./result";
import { MimeType } from "./common";

class DebugWorker extends WorkerBase {
    protected override async get(_request: Request): Promise<Response> {
        return new WorkerResult(
            this,
            "Hello World",
            StatusCodes.OK,
            MimeType.PLAIN_TEXT
        ).response;
    }
}

const worker = new DebugWorker({});
const response = await worker.fetch(
    new Request("https://www.tybusby.com/api/v2", { method: "POST" })
);

const text = await response.text();
console.log(response);
console.log("body:", text || "EMPTY");
