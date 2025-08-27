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

import { BasicWorker } from "../src/basic-worker";
import { TextResponse } from "../src/response";

export class TestWorker extends BasicWorker {
    protected override async get(): Promise<Response> {
        return this.getResponse(TextResponse, "Hello World!");
    }

    protected override async setCachedResponse(): Promise<void> {
        return;
    }

    protected override async getCachedResponse(): Promise<Response | undefined> {
        return;
    }
}
