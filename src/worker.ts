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
    req: Request,
    env: Env,
    ctx: ExecutionContext
) => T;

/**
 * Minimal interface representing a Worker.
 *
 * Any class implementing this interface must provide a `fetch` method
 * that handles a request and returns a Response (or a Promise resolving to a Response).
 */
export interface Worker {
    /**
     * Processes a request and returns a Response.
     *
     * @returns A Promise resolving to the Response
     */
    fetch(): Promise<Response>;
}
