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

import { Worker } from "../interfaces/worker";

/**
 * Abstract base class for middleware.
 *
 * Middleware classes implement request/response processing logic in a
 * chainable manner. Each middleware receives a `Worker` object and a
 * `next` function that invokes the next middleware in the chain.
 *
 * Subclasses **must implement** the `handle` method.
 *
 * Example subclass:
 * ```ts
 * class LoggingMiddleware extends Middleware {
 *     public async handle(worker: Worker, next: () => Promise<Response>): Promise<Response> {
 *         console.log(`Processing request: ${worker.request.url}`);
 *         const response = await next();
 *         console.log(`Response status: ${response.status}`);
 *         return response;
 *      }
 * }
 * ```
 */
export abstract class Middleware {
    /**
     * Process a request in the middleware chain.
     *
     * @param worker - The `Worker` instance representing the request context.
     * @param next - Function to invoke the next middleware in the chain.
     *               Must be called to continue the chain unless the middleware
     *               terminates early (e.g., returns a response directly).
     * @returns A `Response` object, either returned directly or from `next()`.
     */
    public abstract handle(worker: Worker, next: () => Promise<Response>): Promise<Response>;
}
