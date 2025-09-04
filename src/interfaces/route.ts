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

import { MatchFunction } from "path-to-regexp";
import { Method } from "../common";

/**
 * Parameters extracted from a matched route.
 *
 * The keys correspond to named parameters in the route's path pattern,
 * and the values are the strings captured from the URL.
 */
export type RouteParams = Record<string, string>;

/**
 * Type for a route callback function.
 *
 * Route callbacks are executed when a request matches a route.
 *
 * @param params - Named parameters extracted from the URL path.
 * @returns A Response object or a Promise resolving to a Response.
 */
export type RouteCallback = (params: RouteParams) => Response | Promise<Response>;

/**
 * Array of route tuples, used to initialize a `Routes` object.
 *
 * Each tuple consists of:
 * 1. HTTP method (e.g., "GET", "POST")
 * 2. Path string (supports parameters, e.g., "/users/:id")
 * 3. Callback function to handle matched requests
 */
export type RouteTable = [Method, string, RouteCallback][];

/**
 * Represents a single route.
 *
 * Contains all necessary information to match an incoming request and
 * execute the associated callback.
 */
export interface Route {
    /** HTTP method for the route (e.g., GET, POST, etc.) */
    method: Method;

    /** Path-to-regexp matcher function for this route */
    matcher: MatchFunction<RouteParams>;

    /** Callback to execute when the route is matched */
    callback: RouteCallback;
}

/**
 * Result of a route match.
 *
 * Returned by routing logic when a request matches a route pattern.
 */
export interface MatchedRoute {
    /** The route that matched the request */
    route: Route;

    /** Parameters extracted from the URL path */
    params: RouteParams;
}
