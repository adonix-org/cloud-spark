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

import { describe, it, expect } from "vitest";
import { ALL_METHODS, BASIC_METHODS, TestRoutes, VALID_URL } from "./constants";
import { Method } from "../src/common";
import { RouteCallback } from "../src/routes";
import { RouteWorker } from "../src/route-worker";
import { ctx, env } from "./mock";

class TestWorker extends RouteWorker {
    constructor(request: Request) {
        super(request, env, ctx);
    }

    protected registerRoutes(): void {
        this.add(Method.GET, "/unit/tests/:name/:date", async (parms): Promise<Response> => {
            return new Response(JSON.stringify(parms));
        });
    }

    public override add(method: Method, path: string, callback: RouteCallback): this {
        return super.add(method, path, callback);
    }

    public override getAllowedMethods(): Method[] {
        return ALL_METHODS;
    }
}

describe("route worker unit tests", () => {
    it.each(BASIC_METHODS)("returns %s response", async (method) => {
        const request = new Request(VALID_URL, { method });
        const worker = new TestWorker(request);

        const response = await worker.fetch();
        const json = await response.json();

        expect(json).toStrictEqual({
            status: 404,
            error: "Not Found",
            details: "",
        });
    });

    it("handles initialization from a route table", async () => {
        class InitTestWorker extends TestWorker {
            constructor(request: Request) {
                super(request);
                this.load(TestRoutes.table);
            }
        }

        const request = new Request(new URL("one", VALID_URL));
        const worker = new InitTestWorker(request);

        const response = await worker.fetch();
        expect(await response.text()).toBe("one");
    });

    it("handles a route added with add()", async () => {
        const request = new Request(new URL("two", VALID_URL));
        const worker = new TestWorker(request);

        worker.add(Method.GET, "/two", TestRoutes.two);

        const response = await worker.fetch();
        expect(await response.text()).toBe("two");
    });

    it("returns path parameter to the callback function", async () => {
        const request = new Request(new URL("/matches/7834", VALID_URL));
        const worker = new TestWorker(request);

        worker.add(Method.GET, "/matches/:year" as const, async (params): Promise<Response> => {
            return new Response(JSON.stringify(params));
        });

        const response = await worker.fetch();

        expect(response).toBeInstanceOf(Response);
        expect(await response.json()).toStrictEqual({
            year: "7834",
        });
    });

    it("returns multiple path parameters to the callback function", async () => {
        const request = new Request(new URL("/matches/2000/06", VALID_URL));
        const worker = new TestWorker(request);

        worker.add(
            Method.GET,
            "/matches/:year/:month" as const,
            async (params): Promise<Response> => {
                return new Response(JSON.stringify(params));
            }
        );

        const response = await worker.fetch();

        expect(response).toBeInstanceOf(Response);
        expect(await response.json()).toStrictEqual({
            year: "2000",
            month: "06",
        });
    });

    it("returns path parameters from route defined in register routes method", async () => {
        const request = new Request(new URL("/unit/tests/routes/2020-01-01", VALID_URL));
        const worker = new TestWorker(request);

        const response = await worker.fetch();

        expect(response).toBeInstanceOf(Response);
        expect(await response.json()).toStrictEqual({
            name: "routes",
            date: "2020-01-01",
        });
    });
});
