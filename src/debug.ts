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

import { WorkerBase } from "./base";
import { Method, Time } from "./common";
import { HtmlResponse } from "./response";

class DebugWorker extends WorkerBase {
    protected override async get(): Promise<Response> {
        return this.getResponse(HtmlResponse, "Hello World");
    }

    public override getMaxAge(): number {
        return Time.Week;
    }

    public override getAllowOrigins(): string[] {
        return ["https://www.adonix.org", "https://www.tybusby.com"];
    }
}

const method: Method = Method.POST;

const request = new Request("https://www.tybusby.com/api/v2", {
    method: method,
    headers: {
        Origin: "https://www.tybusby.com",
    },
});
const worker = new DebugWorker(request, {});
const response = await worker.fetch();

const text = await response.text();
console.log(response);
console.log("body:", text || "EMPTY");
