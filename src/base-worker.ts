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

import { Worker, WorkerConstructor } from "./worker";

/**
 * A type-safe Cloudflare Worker handler where `fetch` is required.
 *
 * Extends `ExportedHandler` but guarantees that the `fetch` method exists
 * and has the correct signature for Cloudflare Worker invocation.
 *
 * @template E - The type of environment bindings passed to the worker. Defaults to `Env`.
 */
interface FetchHandler<E = Env> extends ExportedHandler<E> {
    /**
     * Handles an incoming request and produces a response.
     *
     * @param request - The incoming `Request` object.
     * @param env - Environment bindings (e.g., KV namespaces, secrets, Durable Objects).
     * @param ctx - Execution context for background tasks (`waitUntil`).
     * @returns A `Promise` that resolves to the response.
     */
    fetch: (request: Request, env: E, ctx: ExecutionContext) => Promise<Response>;
}

/**
 * Provides the foundational structure for handling requests,
 * environment bindings, and the worker execution context.
 *
 * Features:
 * - Holds the current `Request` object (`request` getter).
 * - Provides access to environment bindings (`env` getter).
 * - Provides access to the worker execution context (`ctx` getter).
 * - Subclasses must implement `fetch()` to process the request.
 */
export abstract class BaseWorker implements Worker {
    constructor(
        private readonly _request: Request,
        private readonly _env: Env,
        private readonly _ctx: ExecutionContext
    ) {}

    /** The Request object associated with this worker invocation */
    public get request(): Request {
        return this._request;
    }

    /** Environment bindings (e.g., KV, secrets, or other globals) */
    public get env(): Env {
        return this._env;
    }

    /** Execution context for background tasks or `waitUntil` */
    public get ctx(): ExecutionContext {
        return this._ctx;
    }

    /**
     * Creates a new instance of the current Worker subclass.
     *
     * @param request - The request to pass to the new worker instance.
     * @returns A new worker instance of the same subclass as `this`.
     */
    protected createWorker(request: Request): this {
        const ctor = this.constructor as WorkerConstructor<this>;
        return new ctor(request, this.env, this.ctx);
    }

    /**
     * Process the request and produce a Response.
     *
     * @returns A {@link Response} promise for the {@link Request}.
     */
    public abstract fetch(): Promise<Response>;

    /**
     * **Ignite** your `Worker` implementation into a Cloudflare-compatible handler.
     *
     * @returns A `FetchHandler` that launches a new worker instance for each request.
     *
     * @example
     * ```ts
     * export default MyWorker.ignite();
     * ```
     */
    public static ignite<W extends Worker>(this: WorkerConstructor<W>): FetchHandler {
        return {
            fetch: (req: Request, env: Env, ctx: ExecutionContext) =>
                new this(req, env, ctx).fetch(),
        };
    }
}
