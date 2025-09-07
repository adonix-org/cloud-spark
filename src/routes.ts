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
import { Method } from "./common";
import { MatchedRoute, Route, RouteHandler, PathParams, RouteTable } from "./interfaces/route";

/**
 * Container for route definitions and matching logic.
 * Implements Iterable to allow iteration over all routes.
 */
export class Routes implements Iterable<Route> {
    /** Internal array of registered routes */
    private readonly routes: Route[] = [];

    /**
     * Registers all routes from the given table, replacing any existing routes.
     *
     * @param table - Array of route tuples in the form `[method, path, handler]`.
     *                Each tuple defines an HTTP method, a URL path pattern,
     *                and a handler, which can be either a callback function or a
     *                Worker class.
     */
    public table(table: RouteTable): void {
        this.routes.length = 0;
        table.forEach(([method, path, handler]) => this.add(method, path, handler));
    }

    /**
     * Adds a single route to the container.
     *
     * @param method  - HTTP method for the route (GET, POST, etc.).
     * @param path    - URL path pattern (Express-style, e.g., "/users/:id").
     * @param handler - Function or Worker class to execute when this route matches.
     *                  Can be a `RouteCallback` or a `WorkerClass`.
     */
    public add(method: Method, path: string, handler: RouteHandler) {
        const matcher = match<PathParams>(path);
        this.routes.push({ method, matcher, handler });
    }

    /**
     * Attempt to match a URL against the registered routes.
     * @param method - HTTP method of the request
     * @param url - Full URL string to match against
     * @returns A MatchedRoute object if a route matches, otherwise null
     */
    public match(method: Method, url: string): MatchedRoute | null {
        const pathname = new URL(url).pathname;

        for (const route of this) {
            if (route.method !== method) continue;

            const found = route.matcher(pathname);
            if (found) return { route, params: found.params };
        }

        return null;
    }

    /**
     * Iterate over all registered routes.
     */
    public *[Symbol.iterator](): Iterator<Route> {
        yield* this.routes;
    }
}
