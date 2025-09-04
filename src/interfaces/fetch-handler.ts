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
 * A type-safe Cloudflare Worker handler.
 *
 * Extends `ExportedHandler` but guarantees that the `fetch` method exists
 * and has the correct signature for Cloudflare Worker invocation.
 *
 * @template E - The type of environment bindings passed to the worker. Defaults to `Env`.
 */
export interface FetchHandler extends ExportedHandler<Env> {
    /**
     * Handles an incoming request and produces a response.
     *
     * @param request - The incoming `Request` object.
     * @param env - Environment bindings (e.g., KV namespaces, secrets, Durable Objects).
     * @param ctx - Execution context for background tasks (`waitUntil`).
     * @returns A `Promise` that resolves to the response.
     */
    fetch: (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>;
}
