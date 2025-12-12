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

import { Middleware, OPTIONS, Worker } from "../../core";

import { defaultCorsConfig } from "./constants";
import { CorsConfig, CorsInit } from "./interfaces";
import { apply, options, skipCors } from "./utils";

/**
 * CORS Middleware Implementation
 *
 * Handles Cross-Origin Resource Sharing (CORS) for incoming requests.
 *
 * Behavior:
 * - Invokes the downstream middleware for all requests first by calling `next()`.
 * - If the request is an `OPTIONS` request (preflight), transforms the downstream
 *   response into a preflight CORS response.
 * - For other HTTP methods, applies CORS headers to the downstream response,
 *   unless the response explicitly opts out via `skipCors`.
 *
 * This ensures that all responses comply with the configured CORS rules
 * while still allowing downstream middleware to run for every request.
 *
 * @see {@link cors} for full configuration options and defaults.
 */
export class CorsHandler implements Middleware {
    /** The resolved CORS configuration for this middleware instance. */
    private readonly config: CorsConfig;

    /**
     * Constructs a new `CorsHandler` instance.
     *
     * Merges the provided partial configuration with the default settings.
     *
     * @param init - Optional partial configuration to override defaults.
     *               Any fields not provided will use `defaultCorsConfig`.
     */
    constructor(init?: CorsInit) {
        this.config = { ...defaultCorsConfig, ...init };
    }

    /**
     * Applies CORS handling to an incoming request.
     *
     * @param worker - The Worker instance containing the request and context.
     * @param next - Function invoking the next middleware in the chain.
     * @returns A Response object with CORS headers applied.
     *          - For `OPTIONS` requests, returns a preflight response based on
     *            the downstream response.
     *          - For other methods, returns the downstream response with
     *            CORS headers applied, unless `skipCors` prevents it.
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
