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

import { Method } from "./common";

/**
 * A callback function for a route.
 *
 * @param matches - Captured groups from the route RegExp, or the full match at index 0
 * @returns A Response object or a Promise that resolves to a Response
 */
export type RouteCallback = (...matches: string[]) => Promise<Response>;

/**
 * A single route definition.
 *
 * Tuple of:
 * - HTTP method
 * - Path pattern (string or RegExp)
 * - Callback function
 */
export type RouteTuple = [Method, RegExp | string, RouteCallback];

/**
 * A collection of route definitions.
 *
 * Used to initialize the router with multiple routes.
 */
export type RouteTable = RouteTuple[];

export class Route {
    /**
     * @param pattern  A RegExp or string used to match the request path
     * @param callback  Function to handle requests matching the pattern
     */
    constructor(
        public readonly method: Method,
        public readonly pattern: RegExp,
        public readonly callback: RouteCallback
    ) {}
}

/**
 * A collection of routes grouped by HTTP method.
 *
 * Supports adding routes and retrieving the first matching route for a given method and URL.
 */
export class Routes implements Iterable<Route> {
    private readonly routes: Route[] = [];

    /**
     * Reset all routes and register the given ones.
     *
     * @param table - Tuples of [method, pattern, callback].
     */
    public initialize(table: RouteTuple[]): void {
        this.routes.length = 0;
        table.forEach(([method, pattern, callback]) => this.add(method, pattern, callback));
    }

    /**
     * Adds a route to the collection.
     *
     * @param method - HTTP method (GET, POST, etc.)
     * @param pattern - String or RegExp to match the path
     * @param callback - Function to handle the request
     * @returns The Routes instance (for chaining)
     */
    public add(method: Method, pattern: RegExp | string, callback: RouteCallback): this {
        this.routes.push(new Route(method, new RegExp(pattern), callback));
        return this;
    }

    /**
     * Finds the first route that matches the given method and URL.
     *
     * @param method - HTTP method of the request
     * @param url - Full URL string of the request
     * @returns The first matching Route, or undefined if none match
     */
    public match(method: Method, url: string): Route | undefined {
        const pathname = new URL(url).pathname;
        return this.routes.find((route) => route.method === method && route.pattern.test(pathname));
    }

    /** Allow iteration over all routes */
    public *[Symbol.iterator](): Iterator<Route> {
        yield* this.routes;
    }
}
