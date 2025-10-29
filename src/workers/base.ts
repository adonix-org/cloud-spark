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

import { GET, HEAD, Method } from "../constants/methods";
import { assertMethods, isMethod } from "../guards/methods";
import { FetchHandler } from "../interfaces/fetch";
import { Worker, WorkerClass } from "../interfaces/worker";

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
        private readonly _ctx: ExecutionContext,
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
     * Dispatches the incoming request to the appropriate handler and produces a response.
     *
     * Subclasses must implement this method to define how the worker generates a `Response`
     * for the current request. This is the central point where request processing occurs.
     *
     * @returns A Promise that resolves to the `Response` for the request.
     */
    protected abstract dispatch(): Promise<Response>;

    /**
     * Determines whether a given HTTP method is allowed for this worker.
     *
     * - GET and HEAD are **always allowed**, in compliance with RFC 9110,
     *   even if they are not explicitly listed in `getAllowedMethods()`.
     * - Other methods are allowed only if included in the array returned by
     *   `getAllowedMethods()` and are valid HTTP methods.
     *
     * @param method - The HTTP method to check (e.g., "GET", "POST").
     * @returns `true` if the method is allowed, `false` otherwise.
     */
    public isAllowed(method: string): boolean {
        const methods = this.getAllowedMethods();
        assertMethods(methods);

        // GET and HEAD are always allowed per RFC
        if (method === GET || method === HEAD) return true;

        return isMethod(method) && methods.includes(method);
    }

    public abstract getAllowedMethods(): Method[];

    /**
     * Creates a new instance of the current Worker subclass.
     *
     * @param request - The {@link Request} to pass to the new worker instance.
     * @returns A new worker instance of the same subclass as `this`.
     */
    protected create(request: Request): this {
        const ctor = this.constructor as WorkerClass<this>;
        return new ctor(request, this.env, this.ctx);
    }

    /**
     * Process the {@link Request} and produce a {@link Response}.
     *
     * @returns A {@link Response} promise for the {@link Request}.
     */
    public abstract fetch(): Promise<Response>;

    /**
     * Simplify and standardize {@link Response} creation by extending {@link WorkerResponse}
     * or any of its subclasses and passing to this method.
     *
     * Or directly use any of the built-in classes.
     *
     * ```ts
     * this.response(TextResponse, "Hello World!")
     * ```
     *
     * @param ResponseClass The response class to instantiate
     * @param args Additional constructor arguments
     * @returns A Promise resolving to the {@link Response} object
     */
    protected response<
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Ctor extends new (...args: any[]) => { response(): Promise<Response> },
    >(ResponseClass: Ctor, ...args: ConstructorParameters<Ctor>): Promise<Response> {
        return new ResponseClass(...args).response();
    }

    /**
     * **Ignite** your `Worker` implementation into a Cloudflare handler.
     *
     * @returns A `FetchHandler` that launches a new worker instance for each request.
     *
     * ```ts
     * export default MyWorker.ignite();
     * ```
     */
    public static ignite<W extends Worker>(this: WorkerClass<W>): FetchHandler {
        return {
            fetch: (request: Request, env: Env, ctx: ExecutionContext) =>
                new this(request, env, ctx).fetch(),
        };
    }
}
