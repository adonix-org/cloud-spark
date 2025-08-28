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
import { env, ctx } from "./mock";
import { BasicWorker } from "../src/basic-worker";
import { ALL_METHODS, BASIC_METHODS, GET_REQUEST, VALID_URL } from "./constants";
import { Method } from "../src/common";

class TestWorker extends BasicWorker {
    public override getAllowMethods(): Method[] {
        return ALL_METHODS;
    }
}

describe("basic worker unit tests", () => {
    it.each(BASIC_METHODS)("returns %s response", async (method) => {
        const request = new Request(VALID_URL, { method });
        const worker = new TestWorker(request, env, ctx);

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
        const worker = new TestWorker(request, env, ctx);

        const response = await worker.fetch();
        expect(response).toBeInstanceOf(Response);
        expect(await response.text()).toBe("");
    });

    it("returns OPTIONS response", async () => {
        const request = new Request(VALID_URL, { method: Method.OPTIONS });
        const worker = new TestWorker(request, env, ctx);

        const response = await worker.fetch();
        expect(response).toBeInstanceOf(Response);
        expect(await response.text()).toBe("");
    });

    it("returns a 405 method not allowed response from fetch", async () => {
        class MethodNotAllowedWorker extends BasicWorker {}

        const request = new Request(VALID_URL, { method: Method.POST });
        const worker = new MethodNotAllowedWorker(request, env, ctx);
        const response = await worker.fetch();
        expect(response).toBeInstanceOf(Response);

        const expectedJson = {
            status: 405,
            error: "Method Not Allowed",
            details: "POST method not allowed.",
            allowed: ["GET", "HEAD", "OPTIONS"],
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
            allowed: ["GET", "HEAD", "OPTIONS"],
        };

        expect(await response.json()).toStrictEqual(expectedJson);
    });

    it("returns a 500 internal server error response on error", async () => {
        class DispatchErrorWorker extends TestWorker {
            protected override dispatch(): Promise<Response> {
                throw new Error("Test Error");
            }
        }

        const worker = new DispatchErrorWorker(GET_REQUEST, env, ctx);
        const response = await worker.fetch();
        expect(response).toBeInstanceOf(Response);

        const expectedJson = {
            status: 500,
            error: "Internal Server Error",
            details: "Error: Test Error",
        };

        expect(await response.json()).toStrictEqual(expectedJson);
    });
});
