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
export type RouteCallback = (...matches: string[]) => Response | Promise<Response>;

/**
 * Tuple used to initialize a route.
 *
 * [HTTP method, path pattern (string or RegExp), callback function]
 */
export type RouteInit = [Method, RegExp | string, RouteCallback];

/**
 * Represents a single route with a pattern and a callback.
 */
export class Route {
    public readonly pattern: RegExp;

    /**
     * @param pattern - A RegExp or string used to match the request path
     * @param callback - Function to handle requests matching the pattern
     */
    constructor(pattern: RegExp | string, public readonly callback: RouteCallback) {
        this.pattern = new RegExp(pattern);
    }
}

/**
 * A collection of routes grouped by HTTP method.
 *
 * Supports adding routes and retrieving the first matching route for a given method and URL.
 */
export class Routes {
    private readonly map = new Map<Method, Route[]>();

    /**
     * Adds a route to the collection under the given HTTP method.
     *
     * @param method - HTTP method (GET, POST, etc.)
     * @param route - Route instance to add
     * @returns The Routes instance (for chaining)
     */
    public add(method: Method, route: Route): this {
        const existing = this.map.get(method);
        if (existing) {
            existing.push(route);
        } else {
            this.map.set(method, [route]);
        }
        return this;
    }

    /**
     * Finds the first route that matches the given method and URL.
     *
     * @param method - HTTP method of the request
     * @param url - Full URL string of the request
     * @returns The first matching Route, or undefined if none match
     */
    public get(method: Method, url: string): Route | undefined {
        const routes = this.map.get(method);
        if (!routes) return undefined;

        const pathname = new URL(url).pathname;
        return routes.find(({ pattern }) => pattern.test(pathname));
    }
}
