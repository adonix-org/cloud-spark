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
 * A type-safe Cloudflare Worker handler with a guaranteed `fetch` method.
 *
 * Extends `ExportedHandler` but ensures that `fetch` exists and has the
 * correct signature for Cloudflare Worker invocation.
 *
 * `Env` is a placeholder type for the environment bindings provided by
 * the user (e.g., KV namespaces, secrets, Durable Objects). This interface
 * does not constrain the actual type; it only ensures `fetch` is present.
 */
export interface FetchHandler extends ExportedHandler<Env> {
    /**
     * Handles an incoming request and produces a response.
     *
     * @param request - The incoming `Request` object.
     * @param env - User-provided environment bindings (placeholder type).
     * @param ctx - Execution context for background tasks (`waitUntil`).
     * @returns A `Promise` that resolves to a `Response`.
     */
    fetch: (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>;
}
