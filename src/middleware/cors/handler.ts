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

import { addCorsHeaders } from "./utils";
import { Worker } from "../../interfaces/worker";
import { Middleware } from "../middleware";
import { CorsConfig, CorsInit } from "../../interfaces/cors-config";
import { defaultCorsConfig } from "./constants";
import { ClonedResponse, Options } from "../../responses";
import { OPTIONS } from "../../constants/http";

/**
 * Creates a CORS middleware instance.
 *
 * This middleware automatically handles Cross-Origin Resource Sharing (CORS)
 * for incoming requests, including preflight OPTIONS requests, and adds
 * appropriate headers to responses.
 *
 * @param init - Optional configuration for CORS behavior. See {@link CorsConfig}.
 * @returns A {@link Middleware} instance that can be used in your middleware chain.
 */
export function cors(init?: CorsInit): Middleware {
    return new CorsHandler(init);
}

class CorsHandler extends Middleware {
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
     */
    public override async handle(worker: Worker, next: () => Promise<Response>): Promise<Response> {
        if (worker.request.method === OPTIONS) {
            const options = new Options();
            addCorsHeaders(worker, this.config, options.headers);
            return options.getResponse();
        }

        const response = await next();

        const clone = new ClonedResponse(response);
        addCorsHeaders(worker, this.config, clone.headers);
        return clone.getResponse();
    }
}
