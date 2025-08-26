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

import { Worker } from "./worker";

/**
 * Provides the foundational structure for handling requests, environment bindings,
 * and the worker execution context. Subclasses are expected to implement the
 * `fetch` method to handle the request and return a Response.
 *
 * Features:
 * - Holds the current `Request` object (`request` getter).
 * - Provides access to environment bindings (`env` getter).
 * - Provides access to the worker execution context (`ctx` getter), if available.
 * - Subclasses must implement `fetch()` to process the request.
 */
export abstract class BaseWorker implements Worker {
    constructor(
        private readonly _request: Request,
        private readonly _env: Env = {},
        private readonly _ctx?: ExecutionContext
    ) {}

    /** The Request object associated with this worker invocation */
    protected get request(): Request {
        return this._request;
    }

    /** Environment bindings (e.g., KV, secrets, or other globals) */
    protected get env(): Env {
        return this._env;
    }

    /** Optional execution context for background tasks or `waitUntil` */
    protected get ctx(): ExecutionContext | undefined {
        return this._ctx;
    }

    /**
     * Process the request and produce a Response.
     * Subclasses must implement this method.
     *
     * @returns A Promise resolving to the Response for the request
     */
    public abstract fetch(): Promise<Response>;
}
