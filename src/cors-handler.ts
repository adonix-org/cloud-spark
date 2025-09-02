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
import { addCorsHeaders, allowAnyOrigin, CorsProvider, DEFAULT_CORS_CONFIG } from "./cors";
import { Middleware } from "./middleware";
import { Worker } from "./worker";

/**
 * Middleware that automatically applies CORS headers to responses.
 *
 * Uses a `CorsProvider` to determine the allowed origins, allowed headers,
 * exposed headers, and max age for preflight caching.
 *
 * Can be registered with a `MiddlewareWorker` or any worker that supports middleware.
 */
export class CorsHandler extends Middleware {
    /**
     * Create a new CorsHandler.
     *
     * @param provider - The `CorsProvider` that defines the CORS policy.
     */
    constructor(private readonly provider: CorsProvider = new CorsProvider(DEFAULT_CORS_CONFIG)) {
        super();
    }

    /**
     * Apply CORS headers to the outgoing response.
     *
     * Modifies the response in place according to the `CorsProvider`.
     * Adds `Vary: Origin` if not allowing all origins.
     *
     * @param worker - Worker handling the request.
     * @param response - Response returned from downstream middleware or final handler.
     */
    protected post(worker: Worker, response: Response): void {
        addCorsHeaders(worker, this.provider, response.headers);
        if (!allowAnyOrigin(this.provider)) {
            mergeHeader(response.headers, "Vary", "Origin");
        }
    }
}
