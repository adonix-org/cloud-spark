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

import { getOrCreate, Method } from "./common";

export type RouteCallback<T = any> = (
    this: T,
    ...matches: string[]
) => Response | Promise<Response>;

type RouteTuple = [string | RegExp, RouteCallback, Method];

type RouteInit = RouteTuple[];

export class Route {
    constructor(
        public readonly pattern: string | RegExp,
        public callback: RouteCallback
    ) {}
}

export class Routes<T> {
    private routes = new Map<Method, Route[]>();

    constructor(private readonly binding: T, init?: RouteInit) {
        if (init) {
            for (const [pattern, callback, method] of init) {
                this.append(new Route(pattern, callback), method);
            }
        }
    }

    public append(
        route:
            | Route
            | { pattern: string | RegExp; callback: RouteCallback<T> },
        method: Method = Method.GET
    ): Routes<T> {
        const boundRoute = new Route(
            route.pattern,
            route.callback.bind(this.binding)
        );

        getOrCreate(this.routes, method, () => []).push(boundRoute);

        return this;
    }

    public get(request: Request): Route | undefined {
        const array = this.routes.get(request.method as Method);
        if (!array) return undefined;

        const url = new URL(request.url);
        return array.find(({ pattern }) =>
            pattern instanceof RegExp
                ? pattern.test(url.pathname)
                : pattern === url.pathname
        );
    }
}
