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
    Head,
    InternalServerError,
    MethodNotAllowed,
    NotFound,
} from "./response";

interface RouteHandler {
    route: string | RegExp;
    callback: (...matches: string[]) => Response | Promise<Response>;
}

export class RoutedWorker extends BasicWorker {
    private routes: Map<Method, RouteHandler[]> = new Map();

    constructor(env: Env = {}, ctx?: ExecutionContext) {
        super(env, ctx);
        this.addRoutes();
    }

    protected addRoutes(): void {}

    protected addRoute(
        route: string | RegExp,
        callback: (...matches: string[]) => Response | Promise<Response>,
        method: Method = Method.GET
    ): void {
        if (!isMethod(method)) {
            throw new Error(`Unknown method ${method}`);
        }
        if (!this.getAllowMethods().includes(method)) {
            throw new Error(
                `${method} is not currently allowed. Update or override getAllowedMethods()`
            );
        }

        const bound = callback.bind(this);
        const handlers = this.routes.get(method) ?? [];
        handlers.push({ route, callback: bound });
        this.routes.set(method, handlers);
    }

    public override async fetch(request: Request): Promise<Response> {
        const method = request.method;
        if (!isMethod(method)) {
            throw new Error(`Unsupported method ${method}`);
        }
        if (!this.isAllowed(method)) {
            return this.getResponse(MethodNotAllowed, method);
        }
        let url: URL;
        try {
            url = new URL(request.url);
        } catch {
            return this.getResponse(BadRequest, "Malformed URL");
        }

        return (await this.search(method, url)) ?? super.fetch(request);
    }

    private async search(
        method: Method,
        url: URL
    ): Promise<Response | undefined> {
        const handlers = this.routes.get(method) ?? [];
        const handler = handlers.find(({ route }) =>
            route instanceof RegExp
                ? route.test(url.pathname)
                : route === url.pathname
        );
        if (handler) {
            try {
                if (handler.route instanceof RegExp) {
                    const match = url.pathname.match(handler.route);
                    return await handler.callback(...(match ?? []));
                } else {
                    return await handler.callback();
                }
            } catch (err) {
                return this.getResponse(InternalServerError, String(err));
            }
        }
        return undefined;
    }

    protected override async head(request: Request): Promise<Response> {
        const getRequest = new Request(request, { method: Method.GET });
        return this.getResponse(Head, await this.fetch(getRequest));
    }

    protected override get(): Response | Promise<Response> {
        return this.getResponse(NotFound);
    }

    protected override put(): Response | Promise<Response> {
        return this.getResponse(NotFound);
    }

    protected override post(): Response | Promise<Response> {
        return this.getResponse(NotFound);
    }

    protected override patch(): Response | Promise<Response> {
        return this.getResponse(NotFound);
    }

    protected override delete(): Response | Promise<Response> {
        return this.getResponse(NotFound);
    }
}
