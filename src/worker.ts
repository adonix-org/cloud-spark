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

import { Method } from "./common";
import { Env } from "./env";

/**
 * Represents the constructor of a Worker or a subclass of Worker.
 *
 * @template T - The specific type of Worker being constructed. Defaults to `Worker`.
 * @param req - The `Request` object to be handled by the worker instance.
 * @param env - The environment bindings available to the worker.
 * @param ctx - The `ExecutionContext` for the worker invocation.
 * @returns An instance of the worker type `T`.
 */
export type WorkerConstructor<T extends Worker = Worker> = new (
    request: Request,
    env: Env,
    ctx: ExecutionContext
) => T;

/**
 * Defines the contract for a Cloudflare-compatible Worker.
 *
 * Implementations are responsible for handling incoming requests,
 * providing access to the request, environment bindings, and
 * execution context.
 */
export interface Worker {
    /**
     * Processes the incoming {@link Request} and produces a {@link Response}.
     *
     * @returns A Promise that resolves to the HTTP {@link Response}.
     */
    fetch(): Promise<Response>;

    /**
     * The original {@link Request} being processed by this worker instance.
     */
    get request(): Request;

    /**
     * The environment bindings provided at runtime (e.g., KV, R2, secrets).
     */
    get env(): Env;

    /**
     * The {@link ExecutionContext} associated with the current request,
     * used to manage background tasks and request lifecycle.
     */
    get ctx(): ExecutionContext;

    /**
     * The HTTP methods supported by this worker.
     */
    getAllowedMethods(): Method[];
}
