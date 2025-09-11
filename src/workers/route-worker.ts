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
import { NotFound } from "../errors";
import { Routes } from "../routes";
import { RouteHandler, RouteTable } from "../interfaces/route";
import { WorkerClass } from "../interfaces/worker";
import { BaseWorker } from "./base-worker";
import { Method } from "../constants/http";

/**
 * Base worker supporting route-based request handling.
 *
 * Subclass `RouteWorker` to define a worker with multiple route handlers.
 *
 * Routes can be registered individually via `route()` or in bulk via `routes()`.
 */
export abstract class RouteWorker extends BasicWorker {
    /** Internal table of registered routes. */
    private readonly _routes: Routes = new Routes();

    /**
     * Registers a single new route in the worker.
     *
     * When a request matches the specified method and path, the provided handler
     * will be executed. The handler can be either:
     * - A function that receives URL parameters, or
     * - A Worker subclass that will handle the request.
     *
     * @param method  - HTTP method for the route (GET, POST, etc.).
     * @param path    - URL path pattern (Express-style, e.g., "/users/:id").
     * @param handler - The function or Worker class to run when the route matches.
     * @returns The current worker instance, allowing method chaining.
     */
    protected route(method: Method, path: string, handler: RouteHandler): this {
        this.routes([[method, path, handler]]);
        return this;
    }

    /**
     * Registers multiple routes at once in the worker.
     *
     * Each route should be a tuple `[method, path, handler]` where:
     * - `method`  - HTTP method for the route (GET, POST, etc.).
     * - `path`    - URL path pattern (Express-style, e.g., "/users/:id").
     * - `handler` - A function that receives URL parameters or a Worker subclass
     *               that will handle the request.
     *
     * @param routes - An iterable of routes to register. Each item is a `[method, path, handler]` tuple.
     * @returns The current worker instance, allowing method chaining.
     */
    protected routes(routes: RouteTable): this {
        this._routes.add(routes);
        return this;
    }

    /**
     * Matches the incoming request against registered routes and dispatches it.
     *
     * If a route is found:
     * - If the handler is a Worker class, a new instance is created and its `fetch()` is called.
     * - If the handler is a callback function, it is invoked with the extracted path parameters.
     *
     * If no route matches, the request is passed to the parent `dispatch()` handler.
     *
     * @returns A `Promise<Response>` from the matched handler or parent dispatch.
     */
    protected override async dispatch(): Promise<Response> {
        const found = this._routes.match(this.request.method as Method, this.request.url);
        if (!found) return super.dispatch();

        const { handler } = found.route;
        if (RouteWorker.isWorkerClass(handler)) {
            return new handler(this.request, this.env, this.ctx).fetch();
        }
        return handler.call(this, found.params);
    }

    /**
     * Runtime type guard to check if a given handler is a Worker class.
     *
     * A Worker class is any class that extends `BaseWorker`.
     *
     * @param handler - The constructor function to test.
     * @returns `true` if `handler` is a subclass of `BaseWorker` at runtime, `false` otherwise.
     */
    private static isWorkerClass(handler: RouteHandler): handler is WorkerClass {
        return BaseWorker.prototype.isPrototypeOf(handler.prototype);
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

    protected override async options(): Promise<Response> {
        return this.getResponse(NotFound);
    }
}
