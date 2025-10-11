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

import { OPTIONS } from "../../constants/methods";
import { CorsConfig, CorsInit } from "../../interfaces/cors";
import { Middleware } from "../../interfaces/middleware";
import { Worker } from "../../interfaces/worker";

import { defaultCorsConfig } from "./constants";
import { apply, options, skipCors } from "./utils";

/**
 * Cors Middleware Implementation
 * @see {@link cors}
 */
export class CorsHandler implements Middleware {
    /** The configuration used for this instance, with all defaults applied. */
    private readonly config: CorsConfig;

    /**
     * Create a new `CORS` middleware instance.
     *
     * @param init - Partial configuration to override the defaults. Any values
     *               not provided will use `defaultCorsConfig`.
     */
    constructor(init?: CorsInit) {
        this.config = { ...defaultCorsConfig, ...init };
    }

    /**
     * Applies `CORS` headers to a request.
     *
     * - Returns a preflight response for `OPTIONS` requests.
     * - For other methods, calls `next()` and applies `CORS` headers to the result.
     *
     * @param worker - The Worker handling the request.
     * @param next - Function to invoke the next middleware.
     * @returns Response with `CORS` headers applied.
     */
    public async handle(worker: Worker, next: () => Promise<Response>): Promise<Response> {
        const response = await next();

        if (worker.request.method === OPTIONS) {
            return options(response, worker, this.config);
        }

        if (skipCors(response)) return response;

        return apply(response, worker, this.config);
    }
}
