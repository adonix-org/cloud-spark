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

export type RouteCallback = (...matches: string[]) => Response | Promise<Response>;

export type RouteInit = [Method, string, RouteCallback];

export class Route {
    public readonly pattern: RegExp;

    constructor(pattern: RegExp | string, public readonly callback: RouteCallback) {
        this.pattern = new RegExp(pattern);
    }
}

export class Routes {
    private readonly map = new Map<Method, Route[]>();

    public add(method: Method, route: Route) {
        const existing = this.map.get(method);
        if (existing) {
            existing.push(route);
        } else {
            this.map.set(method, [route]);
        }
        return this;
    }

    public get(method: Method, url: string): Route | undefined {
        const routes = this.map.get(method);
        if (!routes) return undefined;

        return routes.find(({ pattern }) => pattern.test(new URL(url).pathname));
    }
}
