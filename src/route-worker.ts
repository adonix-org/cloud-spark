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
import { Routes, RouteCallback, RouteTable } from "./routes";

export abstract class RouteWorker extends BasicWorker {
    protected readonly routes: Routes = new Routes();

    protected abstract registerRoutes(): void;

    protected load(table: RouteTable): void {
        this.routes.load(table);
    }

    protected add(method: Method, path: string, callback: RouteCallback): this {
        this.routes.add(method, path, callback);
        return this;
    }

    protected async dispatch(): Promise<Response> {
        this.registerRoutes();

        const found = this.routes.match(this.request.method as Method, this.request.url);
        if (!found) return super.dispatch();

        return found.route.callback.call(this, found.params);
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
