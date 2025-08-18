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
import { Method } from "./common";
import { Head, NotFound } from "./response";

interface RouteHandler {
    route: string | RegExp;
    callback: (
        request: Request,
        ...matches: string[]
    ) => Response | Promise<Response>;
}

export abstract class RoutedWorker extends BasicWorker {
    private readonly routes: Map<Method, RouteHandler[]> = new Map();

    constructor(env: Env = {}, ctx?: ExecutionContext) {
        super(env, ctx);
        this.addRoutes();
    }

    protected abstract addRoutes(): void;

    protected addRoute(
        route: string | RegExp,
        callback: (
            request: Request,
            ...matches: string[]
        ) => Response | Promise<Response>,
        method: Method = Method.GET
    ): void {
        if (!this.isAllowed(method)) {
            throw new Error(
                `${method} is not currently allowed. Update or override getAllowedMethods()`
            );
        }

        const bound = callback.bind(this);
        const handlers = this.routes.get(method) ?? [];
        handlers.push({ route, callback: bound });
        this.routes.set(method, handlers);
    }

    protected async dispatch(request: Request): Promise<Response> {
        return (await this.search(request)) ?? super.dispatch(request);
    }

    private async search(request: Request): Promise<Response | undefined> {
        const method = request.method as Method;
        const url = new URL(request.url);
        const handlers = this.routes.get(method) ?? [];
        const handler = handlers.find(({ route }) =>
            route instanceof RegExp
                ? route.test(url.pathname)
                : route === url.pathname
        );
        if (handler) {
            if (handler.route instanceof RegExp) {
                const match = url.pathname.match(handler.route);
                return await handler.callback(request, ...(match ?? []));
            } else {
                return await handler.callback(request);
            }
        }
        return undefined;
    }

    protected override async head(request: Request): Promise<Response> {
        return this.getResponse(
            Head,
            await this.dispatch(new Request(request, { method: Method.GET }))
        );
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
