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

import { match } from "path-to-regexp";

import { BadRequest, GET, Middleware, UpgradeRequired, Worker } from "../../core";

import { hasConnectionHeader, hasUpgradeHeader, hasWebSocketVersion } from "./utils";

/**
 * Middleware for validating WebSocket upgrade requests.
 *
 * - Only applies to `GET` requests.
 * - Matches requests against a specific path using `path-to-regexp` patterns.
 * - Validates that the request contains required WebSocket headers:
 *   - `Connection: Upgrade`
 *   - `Upgrade: websocket`
 *   - `Sec-WebSocket-Version` matches the expected version
 * - Returns an error response if any validation fails.
 * - Otherwise, passes control to the next middleware or origin handler.
 */
export class WebSocketHandler implements Middleware {
    /**
     * Creates a new WebSocketHandler for a specific path.
     *
     * @param path - The request path this handler should intercept for WebSocket upgrades.
     *               Supports dynamic segments using `path-to-regexp` syntax.
     */
    constructor(private readonly path: string) {}

    /**
     * Handles an incoming request, validating WebSocket upgrade headers.
     *
     * @param worker - The Worker instance containing the request.
     * @param next - Function to invoke the next middleware.
     * @returns A Response object if the request fails WebSocket validation,
     *          or the result of `next()` if the request is valid or does not match.
     */
    public handle(worker: Worker, next: () => Promise<Response>): Promise<Response> {
        if (worker.request.method !== GET) {
            return next();
        }

        if (!this.isMatch(worker.request)) {
            return next();
        }

        const headers = worker.request.headers;
        if (!hasConnectionHeader(headers)) {
            return new BadRequest("Missing or invalid 'Connection' header").response();
        }
        if (!hasUpgradeHeader(headers)) {
            return new BadRequest("Missing or invalid 'Upgrade' header").response();
        }
        if (!hasWebSocketVersion(headers)) {
            return new UpgradeRequired().response();
        }

        return next();
    }

    /**
     * Checks if the request path matches the configured path for this handler.
     *
     * @param request - The incoming Request object.
     * @returns `true` if the request path matches, `false` otherwise.
     */
    private isMatch(request: Request): boolean {
        return match(this.path)(new URL(request.url).pathname) !== false;
    }
}
