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

import { BasicWorker } from "./basic-worker";
import { isMethod, Method } from "./common";
import {
    BadRequest,
    InternalServerError,
    MethodNotAllowed,
    NotFound,
} from "./response";

interface RouteHandler {
    route: string | RegExp;
    callback: () => Response | Promise<Response>;
}

export abstract class RoutedWorker extends BasicWorker {
    private routes: Map<Method, RouteHandler[]> = new Map();

    constructor(_request: Request, _env: Env = {}, _ctx?: ExecutionContext) {
        super(_request, _env, _ctx);
        this.addRoutes();
    }

    protected abstract addRoutes(): void;

    protected addRoute(
        route: string | RegExp,
        callback: () => Response | Promise<Response>,
        method: Method = Method.GET
    ): void {
        const boundCallback = callback.bind(this);

        if (!isMethod(method)) {
            throw new Error(`Unknown method ${method}`);
        }

        // Subclass is adding a method that is not allowed.
        if (!this.getAllowMethods().includes(method)) {
            throw new Error(
                `${method} is not currently allowed. Update or override getAllowedMethods()`
            );
        }
        const handlers = this.routes.get(method) ?? [];
        handlers.push({ route, callback: boundCallback });
        this.routes.set(method, handlers);
    }

    public override async fetch(): Promise<Response> {
        const method = this.request.method;
        if (!isMethod(method)) {
            throw new Error(`Unsupported method ${method}`);
        }
        if (!this.isAllowed(this.request.method)) {
            return this.getResponse(MethodNotAllowed, this.request.method);
        }

        let url: URL;
        try {
            url = new URL(this.request.url);
        } catch {
            // Malformed URL — client sent something we can't parse
            return this.getResponse(BadRequest, "Malformed URL");
        }

        const handlers = this.routes.get(method) ?? [];
        const match = handlers.find(({ route }) =>
            route instanceof RegExp
                ? route.test(url.pathname)
                : route === url.pathname
        );

        if (match) {
            try {
                return await match.callback();
            } catch (err) {
                return this.getResponse(InternalServerError, String(err));
            }
        }
        return this.getResponse(NotFound);
    }
}
