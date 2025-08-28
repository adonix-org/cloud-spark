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
import { NotFound } from "./errors";
import { Route, Routes, RouteInit, RouteCallback } from "./routes";

export abstract class RouteWorker extends BasicWorker {
    private readonly routes: Routes = new Routes();

    protected initialize(routes: RouteInit[]) {
        routes.forEach(([method, pattern, callback]) => {
            this.add(method, pattern, callback);
        });
    }

    protected add(method: Method, pattern: RegExp | string, callback: RouteCallback) {
        this.routes.add(method, new Route(pattern, callback));
        return this;
    }

    protected async dispatch(request: Request = this.request): Promise<Response> {
        const route = this.routes.match(request.method as Method, request.url);
        if (!route) return super.dispatch();

        const match = new URL(request.url).pathname.match(route.pattern) ?? [];
        return route.callback.call(this, ...match);
    }

    protected override async get(): Promise<Response> {
        return this.getResponse(NotFound);
    }

    protected override async put(): Promise<Response> {
        return this.getResponse(NotFound);
    }

    protected override async post(): Promise<Response> {
        return this.getResponse(NotFound);
    }

    protected override async patch(): Promise<Response> {
        return this.getResponse(NotFound);
    }

    protected override async delete(): Promise<Response> {
        return this.getResponse(NotFound);
    }
}
