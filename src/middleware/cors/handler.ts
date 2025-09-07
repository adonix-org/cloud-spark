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
import { CorsConfig, CorsInit } from "../../interfaces/cors-config";
import { defaultCorsConfig } from "./defaults";

/**
 * Middleware that applies Cross-Origin Resource Sharing (CORS) headers to responses.
 *
 * This middleware reads the configuration provided (or uses `defaultCorsConfig`)
 * and ensures that responses include the appropriate CORS headers. It also
 * handles the `Vary: Origin` header when not allowing all origins.
 *
 * Example usage:
 * ```ts
 * const cors = new CorsHandler({ allowedOrigins: ["https://myapp.com"] });
 * worker.use(cors);
 * ```
 */
export class CorsHandler extends Middleware {
    /** The configuration used for this instance, with all defaults applied. */
    private readonly config: CorsConfig;

    /**
     * Create a new CORS middleware instance.
     *
     * @param init - Partial configuration to override the defaults. Any values
     *               not provided will use `defaultCorsConfig`.
     */
    constructor(init?: CorsInit) {
        super();
        this.config = { ...defaultCorsConfig, ...init };
    }

    /**
     * Handle a request by applying CORS headers to the response.
     *
     * @param worker - The Worker instance containing the request context.
     * @param next - Function to invoke the next middleware in the chain.
     * @returns A Response object with CORS headers applied.
     *
     * This middleware does not short-circuit the request; it always calls `next()`
     * and modifies the resulting response.
     */
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
