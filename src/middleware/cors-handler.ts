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

import { mergeHeader } from "../common";
import { addCorsHeaders, allowAnyOrigin, CorsConfig, CorsProvider } from "../cors";
import { Worker } from "../worker";
import { Middleware } from "./middleware";

/**
 * Middleware that automatically applies CORS headers to responses.
 *
 * Uses a `CorsProvider` to determine the allowed origins, allowed headers,
 * exposed headers, and max age for preflight caching.
 *
 * Can be registered with a `MiddlewareWorker` or any worker that supports middleware.
 */
export class CorsHandler extends Middleware {
    private readonly provider: CorsProvider;

    constructor(init?: CorsProvider | CorsConfig) {
        super();
        if (init) {
            this.provider = init instanceof CorsProvider ? init : new CorsProvider(init);
        } else {
            this.provider = new CorsProvider();
        }
    }

    public override async handle(worker: Worker, next: () => Promise<Response>): Promise<Response> {
        const response = await next();

        const mutable = new Response(response.body, response);

        addCorsHeaders(worker, this.provider, mutable.headers);
        if (!allowAnyOrigin(this.provider)) {
            mergeHeader(mutable.headers, "Vary", "Origin");
        }

        return mutable;
    }
}
