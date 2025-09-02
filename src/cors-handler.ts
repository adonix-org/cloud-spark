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

import { mergeHeader } from "./common";
import { addCorsHeaders, CorsProvider } from "./cors";
import { Middleware } from "./middleware-worker";
import { Worker } from "./worker";

export class CorsHandler implements Middleware {
    constructor(private readonly provider: CorsProvider) {}

    public async handle(worker: Worker, next: () => Promise<Response>): Promise<Response> {
        return next().then((response) => {
            addCorsHeaders(worker, this.provider, response.headers);

            if (!this.provider.allowAnyOrigin()) {
                mergeHeader(response.headers, "Vary", "Origin");
            }
            return response;
        });
    }
}
