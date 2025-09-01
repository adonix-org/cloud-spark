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

export type RouteCallback = (params: Record<string, string>) => Promise<Response> | Response;

export interface Route {
    method: Method;
    matcher: MatchFunction<Record<string, string>>;
    callback: RouteCallback;
}

export interface MatchedRoute {
    route: Route;
    params: Record<string, string>;
}

export type RouteTuple = [Method, string, RouteCallback];
export type RouteTable = RouteTuple[];

export class Routes implements Iterable<Route> {
    private readonly routes: Route[] = [];

    public initialize(table: RouteTable): void {
        this.routes.length = 0;
        table.forEach(([method, path, callback]) => this.add(method, path, callback));
    }

    public add(method: Method, path: string, callback: RouteCallback) {
        const matcher = match<Record<string, string>>(path, {
            decode: decodeURIComponent,
        });
        this.routes.push({ method, matcher, callback });
    }

    public match(method: Method, url: string): MatchedRoute | null {
        const pathname = new URL(url).pathname;

        for (const route of this) {
            if (route.method !== method) continue;
            const result = route.matcher(pathname);
            if (result) return { route, params: result.params };
        }

        return null;
    }

    public *[Symbol.iterator](): Iterator<Route> {
        yield* this.routes;
    }
}
