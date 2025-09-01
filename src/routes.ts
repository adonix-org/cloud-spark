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

import { match, MatchFunction } from "path-to-regexp";
import { Method } from "./common";

/** Parameters extracted from a matched route */
export type RouteParams = Record<string, string>;

/**
 * Type for a route callback function.
 * @param params - Named parameters extracted from the URL path.
 * @returns A Response object or a Promise resolving to a Response.
 */
export type RouteCallback = (params: RouteParams) => Promise<Response> | Response;

/**
 * Represents a single route.
 */
export interface Route {
    /** HTTP method for the route */
    method: Method;
    /** Path-to-regexp matcher function for this route */
    matcher: MatchFunction<RouteParams>;
    /** Callback to execute when the route is matched */
    callback: RouteCallback;
}

/**
 * Result of a route match.
 */
export interface MatchedRoute {
    /** The route that matched */
    route: Route;
    /** Parameters extracted from the URL path */
    params: RouteParams;
}

/** Tuple type representing a single route: [method, path, callback] */
export type RouteTuple = [Method, string, RouteCallback];

/** Array of route tuples, used to initialize Routes */
export type RouteTable = RouteTuple[];

/**
 * Container for route definitions and matching logic.
 * Implements Iterable to allow iteration over all routes.
 */
export class Routes implements Iterable<Route> {
    /** Internal array of registered routes */
    private readonly routes: Route[] = [];

    /**
     * Initialize the route container with a table of routes.
     * Clears any previously registered routes.
     * @param table - Array of [method, path, callback] tuples
     */
    public initialize(table: RouteTable): void {
        this.routes.length = 0;
        table.forEach(([method, path, callback]) => this.add(method, path, callback));
    }

    /**
     * Add a single route to the container.
     * @param method - HTTP method (GET, POST, etc.)
     * @param path - URL path pattern (Express-style, e.g., "/users/:id")
     * @param callback - Function to execute when this route matches
     */
    public add(method: Method, path: string, callback: RouteCallback) {
        const matcher = match<RouteParams>(path, {
            decode: decodeURIComponent,
        });
        this.routes.push({ method, matcher, callback });
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

            const result = route.matcher(pathname);
            if (result) return { route, params: result.params };
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
