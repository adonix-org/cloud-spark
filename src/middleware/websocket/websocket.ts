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

import { Middleware } from "../../core";

import { WebSocketHandler } from "./handler";

/**
 * Returns a middleware that validates incoming WebSocket upgrade requests.
 *
 * - Only validates the upgrade request; it does **not** perform the actual WebSocket upgrade.
 * - Ensures the request:
 *   - Uses the `GET` method.
 *   - Matches the specified path, supporting `path-to-regexp` style patterns
 *     (e.g., `/chat/:name`).
 *   - Contains required WebSocket headers:
 *     - `Connection: Upgrade`
 *     - `Upgrade: websocket`
 *     - `Sec-WebSocket-Version: 13`
 * - Returns an error response if validation fails, otherwise passes control to
 *   the next middleware or origin handler.
 *
 * @param path - The URL path to intercept for WebSocket upgrades. Defaults to `/`.
 *               Supports dynamic segments using `path-to-regexp` syntax.
 * @returns A {@link Middleware} instance that can be used in your middleware chain.
 *
 * @example
 * ```ts
 * app.use(websocket("/chat/:name"));
 * ```
 */
export function websocket(path: string = "/"): Middleware {
    return new WebSocketHandler(path);
}
