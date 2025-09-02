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
import { describe, it, expect, vi } from "vitest";
import { env, ctx } from "./mock";
import { BasicWorker } from "../src/basic-worker";
import { ALL_METHODS, BASIC_METHODS, GET_REQUEST, VALID_URL } from "./constants";
import { Method } from "../src/common";

class TestWorker extends BasicWorker {
    constructor(request: Request) {
        super(request, env, ctx);
    }

    public override getAllowedMethods(): Method[] {
        return ALL_METHODS;
    }
}

describe("basic worker unit tests", () => {
    it.each(BASIC_METHODS)("returns %s response", async (method) => {
        const request = new Request(VALID_URL, { method });
        const worker = new TestWorker(request);

        const response = await worker.fetch();
        expect(response).toBeInstanceOf(Response);

        const expectedJson = (method: Method) => ({
            status: 501,
            error: "Not Implemented",
            details: `${method} method not implemented.`,
        });

        const json = await response.json();
        expect(json).toStrictEqual(expectedJson(method));
    });

    it("returns HEAD response", async () => {
        const request = new Request(VALID_URL, { method: Method.HEAD });
        const worker = new TestWorker(request);

        const response = await worker.fetch();
        expect(response).toBeInstanceOf(Response);
        expect(await response.text()).toBe("");
    });

    it("returns OPTIONS response", async () => {
        const request = new Request(VALID_URL, { method: Method.OPTIONS });
        const worker = new TestWorker(request);

        const response = await worker.fetch();
        expect(response).toBeInstanceOf(Response);
        expect(await response.text()).toBe("");
    });

    it("returns the cached response", async () => {
        class CacheTest extends TestWorker {
            protected override async dispatch(): Promise<Response> {
                return new Response("OK", {
                    headers: { "X-Test-Random": Math.random().toString() },
                });
            }
        }
        const worker = new CacheTest(GET_REQUEST);

        const firstResponse = await worker.fetch();
        const firstHeader = firstResponse.headers.get("X-Test-Random");

        const secondResponse = await worker.fetch();
        const secondHeader = secondResponse.headers.get("X-Test-Random");

        expect(firstHeader).toBe(secondHeader);
    });

    it("returns a 405 method not allowed response from fetch", async () => {
        const request = new Request(VALID_URL, { method: "BAD" as any });
        const worker = new TestWorker(request);
        const response = await worker.fetch();
        expect(response).toBeInstanceOf(Response);

        const expectedJson = {
            status: 405,
            error: "Method Not Allowed",
            details: "BAD method not allowed.",
        };

        expect(await response.json()).toStrictEqual(expectedJson);
    });

    it("returns a 405 method not allowed response from dispatch", async () => {
        class MethodNotAllowedWorker extends BasicWorker {
            public override dispatch(): Promise<Response> {
                return super.dispatch();
            }
        }

        const request = new Request(VALID_URL, { method: "BAD" as any });
        const worker = new MethodNotAllowedWorker(request, env, ctx);
        const response = await worker.dispatch();
        expect(response).toBeInstanceOf(Response);

        const expectedJson = {
            status: 405,
            error: "Method Not Allowed",
            details: "BAD method not allowed.",
        };

        expect(await response.json()).toStrictEqual(expectedJson);
    });

    it("safely returns and logs a 500 internal server error response", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        class DispatchErrorWorker extends TestWorker {
            protected override async dispatch(): Promise<Response> {
                throw new Error("Log but do not expose in the response");
            }
        }

        const worker = new DispatchErrorWorker(GET_REQUEST);
        const response = await worker.fetch();

        expect(response).toBeInstanceOf(Response);
        const expectedJson = {
            status: 500,
            error: "Internal Server Error",
            details: "",
        };
        expect(await response.json()).toStrictEqual(expectedJson);

        expect(consoleSpy).toHaveBeenCalled();
        const loggedError = consoleSpy.mock.calls[0]![0];
        expect(loggedError).toBeInstanceOf(Error);
        expect(loggedError.message).toContain("Log but do not expose in the response");
        consoleSpy.mockRestore();
    });
});
