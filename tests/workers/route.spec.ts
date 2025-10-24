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
import { DEFAULT_METHODS, MUTATE_METHODS, TestRoutes, VALID_URL } from "@common";
import { Method } from "@src/constants/methods";
import { RouteHandler } from "@src/interfaces/route";
import { RouteWorker } from "@src/workers/route";
import { ctx, env } from "@mock";

class TestWorker extends RouteWorker {
    constructor(
        request: Request,
        public methods = DEFAULT_METHODS,
    ) {
        super(request, env, ctx);
    }

    protected init(): void {
        this.route(Method.GET, "/unit/tests/:name/:date", async (params): Promise<Response> => {
            return new Response(JSON.stringify(params));
        });
    }

    public override route(method: Method, path: string, handler: RouteHandler): this {
        return super.route(method, path, handler);
    }

    public override getAllowedMethods(): Method[] {
        return this.methods;
    }
}

describe("route worker unit tests", () => {
    it("returns get 404 response", async () => {
        const request = new Request(VALID_URL);
        const worker = new TestWorker(request);

        const response = await worker.fetch();
        expect(response).toBeInstanceOf(Response);

        const json = await response.json();
        expect(json).toStrictEqual({
            details: "",
            error: "Not Found",
            status: 404,
        });
    });

    it.each(MUTATE_METHODS)("returns %s 405 response", async (method) => {
        const request = new Request(VALID_URL, { method });
        const worker = new TestWorker(request);

        const response = await worker.fetch();
        expect(response).toBeInstanceOf(Response);

        const expectedJson = (method: Method) => ({
            status: 405,
            error: "Method Not Allowed",
            details: `${method} method not allowed.`,
        });

        const json = await response.json();
        expect(json).toStrictEqual(expectedJson(method));
    });

    it.each(MUTATE_METHODS)("returns %s 404 response for non-get", async (method) => {
        const request = new Request(VALID_URL, { method });
        const worker = new TestWorker(request, MUTATE_METHODS);

        const response = await worker.fetch();
        expect(response).toBeInstanceOf(Response);

        const json = await response.json();
        expect(json).toStrictEqual({
            details: "",
            error: "Not Found",
            status: 404,
        });
    });

    it("handles initialization from a route table", async () => {
        class InitTestWorker extends TestWorker {
            constructor(request: Request) {
                super(request);
                this.routes(TestRoutes.table);
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

        worker.route(Method.GET, "/two", TestRoutes.two);

        const response = await worker.fetch();
        expect(await response.text()).toBe("two");
    });

    it("returns path parameter to the callback function", async () => {
        const request = new Request(new URL("/matches/7834", VALID_URL));
        const worker = new TestWorker(request);

        worker.route(Method.GET, "/matches/:year" as const, async (params): Promise<Response> => {
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

        worker.route(
            Method.GET,
            "/matches/:year/:month" as const,
            async (params): Promise<Response> => {
                return new Response(JSON.stringify(params));
            },
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

    it("returns decoded path parameters", async () => {
        const request = new Request(new URL("/unit/tests/hello world/2020-01-01", VALID_URL));
        const worker = new TestWorker(request);

        expect(request.url).toBe("https://localhost/unit/tests/hello%20world/2020-01-01");

        const response = await worker.fetch();

        expect(response).toBeInstanceOf(Response);
        expect(await response.json()).toStrictEqual({
            name: "hello world",
            date: "2020-01-01",
        });
    });

    it("returns sub worker path parameters", async () => {
        class SubWorker extends RouteWorker {
            protected init(): void {
                this.route(Method.GET, "/subworker/:keyword", async (params): Promise<Response> => {
                    return new Response(JSON.stringify(params));
                });
            }
        }

        const request = new Request(new URL("/subworker/ignite", VALID_URL));
        const worker = new TestWorker(request);
        worker.route(Method.GET, "/subworker/*path", SubWorker);

        const response = await worker.fetch();

        expect(response).toBeInstanceOf(Response);
        expect(await response.json()).toStrictEqual({ keyword: "ignite" });
    });
});
