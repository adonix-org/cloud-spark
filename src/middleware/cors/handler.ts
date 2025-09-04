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

import { mergeHeader } from "../../common";
import { addCorsHeaders, allowAnyOrigin } from "./utils";
import { Worker } from "../../interfaces/worker";
import { Middleware } from "../middleware";
import { CorsConfig } from "../../interfaces/cors-config";
import { DEFAULT_CORS_CONFIG } from "./defaults";

export class CorsHandler extends Middleware {
    private readonly config: Required<CorsConfig>;

    constructor(init?: Partial<CorsConfig>) {
        super();
        this.config = { ...DEFAULT_CORS_CONFIG, ...init };
    }

    public override async handle(worker: Worker, next: () => Promise<Response>): Promise<Response> {
        const response = await next();

        const mutable = new Response(response.body, response);

        addCorsHeaders(worker, this.config, mutable.headers);
        if (!allowAnyOrigin(this.config)) {
            mergeHeader(mutable.headers, "Vary", "Origin");
        }

        return mutable;
    }
}
