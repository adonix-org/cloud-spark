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
import { addCorsHeaders, allowAnyOrigin, CorsProvider } from "./cors";
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
export class CorsHandler implements Middleware {
    /**
     * Create a new CorsHandler.
     *
     * @param provider - The `CorsProvider` that defines the CORS policy.
     */
    constructor(private readonly provider: CorsProvider) {}

    /**
     * Handles a request by invoking the next middleware or final handler,
     * then applying the appropriate CORS headers to the response.
     *
     * @param worker - The worker handling the request. Provides access
     *                 to the request, environment, and execution context.
     * @param next - Function that calls the next middleware or final handler.
     *               Must return a Promise resolving to a Response.
     * @returns A Promise resolving to the Response with CORS headers applied.
     */
    public async handle(worker: Worker, next: () => Promise<Response>): Promise<Response> {
        return next().then((response) => {
            addCorsHeaders(worker, this.provider, response.headers);

            if (!allowAnyOrigin(this.provider)) {
                mergeHeader(response.headers, "Vary", "Origin");
            }
            return response;
        });
    }
}
