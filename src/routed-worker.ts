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
import { NotFound } from "./response";
import { Route, Routes, RouteInit } from "./route";

export abstract class RoutedWorker extends BasicWorker {
    private readonly routes: Routes = new Routes(this);

    constructor(request: Request, env: Env = {}, ctx?: ExecutionContext) {
        super(request, env, ctx);
    }

    protected initialize(routes: RouteInit[]) {
        routes.forEach((route) => {
            this.addRoute(route);
        });
    }

    protected addRoute(route: RouteInit) {
        this.routes.append(route[0], new Route(route[1], route[2]));
        return this;
    }

    protected async dispatch(request: Request): Promise<Response> {
        const route = this.routes.get(request.method as Method, request.url);
        if (!route) return await super.dispatch(request);

        const match = this.requestUrl.pathname.match(route.pattern);
        return await route.callback(...(match ?? []));
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
