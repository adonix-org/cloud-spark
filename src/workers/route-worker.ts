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
import { Method } from "../common";
import { NotFound } from "../errors";
import { Routes } from "../routes";
import { RouteCallback, RouteTable } from "../interfaces/route";

/**
 * Base worker supporting route-based request handling.
 *
 * Subclass `RouteWorker` to define a worker with multiple route handlers.
 *
 * Routes can be registered individually via `addRoute()` or in bulk via `load()`.
 * Middleware can be attached with `use()` to run for all requests.
 * ```
 */
export abstract class RouteWorker extends BasicWorker {
    /** Internal table of registered routes. */
    private readonly routes: Routes = new Routes();

    /**
     * Load multiple routes at once from a route table.
     * @param table - Array of routes to register.
     */
    protected load(table: RouteTable): void {
        this.routes.load(table);
    }

    /**
     * Add a single route.
     * @param method - HTTP method (GET, POST, etc.)
     * @param path - Route path, supports parameters like "/users/:id"
     * @param callback - Function to handle requests matching this route
     * @returns `this` for chaining multiple route additions
     */
    protected addRoute(method: Method, path: string, callback: RouteCallback): this {
        this.routes.add(method, path, callback);
        return this;
    }

    /**
     * Matches the incoming request against registered routes and executes the callback.
     * Falls back to the default handler if no match is found.
     * This is called automatically when the worker handles a request.
     */
    protected override async dispatch(): Promise<Response> {
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
