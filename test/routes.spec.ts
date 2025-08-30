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

import { describe, it, expect, beforeEach } from "vitest";
import { TestRoutes, VALID_URL } from "./constants";
import { Method } from "../src/common";
import { Routes, RouteTable } from "../src/routes";

const init: RouteTable = [
    [Method.GET, "^/one$", TestRoutes.one],
    [Method.GET, /^\/two$/, TestRoutes.two],
];

describe("routes unit tests", () => {
    let routes: Routes;

    beforeEach(() => {
        routes = new Routes();
        routes.initialize(init);
    });

    it("returns the route initialized with string", async () => {
        const url = new URL("one", VALID_URL);
        const route = routes.match(Method.GET, url.toString())?.route;
        expect(route).toBeDefined();
        expect(route?.callback).toBe(TestRoutes.one);
        await TestRoutes.expectResponseBody(route!.callback, "one");
    });

    it("returns the route initialized with regex", async () => {
        const url = new URL("two", VALID_URL);
        const route = routes.match(Method.GET, url.toString())?.route;
        expect(route).toBeDefined();
        expect(route?.callback).toBe(TestRoutes.two);
        await TestRoutes.expectResponseBody(route!.callback, "two");
    });

    it("returns undefined when the pattern is not found", () => {
        const url = new URL("four", VALID_URL);
        const route = routes.match(Method.GET, url.toString());
        expect(route).toBeUndefined();
    });

    it("returns undefined when the method is not found", () => {
        const url = new URL("one", VALID_URL);
        const route = routes.match(Method.PUT, url.toString());
        expect(route).toBeUndefined();
    });

    it("returns a route added after initialization", async () => {
        const method = Method.POST;
        const url = new URL("three", VALID_URL);
        const pattern = /^\/three$/;

        routes.add(method, pattern, TestRoutes.three);
        const route = routes.match(method, url.toString())?.route;

        expect(route).toBeDefined();
        expect(route?.pattern).toStrictEqual(pattern);
        expect(route?.callback).toBe(TestRoutes.three);
        await TestRoutes.expectResponseBody(route!.callback, "three");
    });

    it("matches the root url", async () => {
        const method = Method.POST;
        const url = new URL(VALID_URL);
        const pattern = /^\/$/;

        routes.add(method, pattern, TestRoutes.four);
        const route = routes.match(method, url.toString())?.route;

        expect(route).toBeDefined();
        expect(route?.pattern).toStrictEqual(pattern);
        expect(route?.callback).toBe(TestRoutes.four);
        await TestRoutes.expectResponseBody(route!.callback, "four");
    });
});
