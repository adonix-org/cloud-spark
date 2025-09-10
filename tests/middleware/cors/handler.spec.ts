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

import { describe, expect, it } from "vitest";
import {
    GET_REQUEST,
    GET_REQUEST_INVALID_ORIGIN,
    GET_REQUEST_WITH_ORIGIN,
    VALID_ORIGIN,
    VALID_URL,
} from "@constants";
import { ctx, env } from "@mock";
import { CorsHandler } from "@src/middleware/cors/handler";
import { BasicWorker } from "@src/workers/basic-worker";
import { GET, HEAD, Method, OPTIONS } from "@src/common";

class TestWorker extends BasicWorker {
    constructor(request: Request) {
        super(request, env, ctx);
    }

    protected init(): void {
        this.use(new CorsHandler());
    }

    protected override async get(): Promise<Response> {
        return new Response("Ok");
    }

    public override getAllowedMethods(): Method[] {
        return [GET, HEAD, OPTIONS];
    }
}

class TestOriginWorker extends TestWorker {
    protected init(): void {
        this.use(new CorsHandler({ allowedOrigins: [VALID_ORIGIN] }));
    }
}

describe("cors middleware unit tests", () => {
    it("returns response with cors headers", async () => {
        const worker = new TestWorker(GET_REQUEST_WITH_ORIGIN);
        const response = await worker.fetch();
        expect([...response.headers.entries()]).toStrictEqual([
            ["access-control-allow-headers", "Content-Type"],
            ["access-control-allow-methods", "GET, HEAD, OPTIONS"],
            ["access-control-allow-origin", "*"],
            ["access-control-max-age", "604800"],
            ["content-type", "text/plain;charset=UTF-8"],
        ]);
    });

    it("returns response without cors headers", async () => {
        const worker = new TestWorker(GET_REQUEST);
        const response = await worker.fetch();
        expect([...response.headers.entries()]).toStrictEqual([
            ["content-type", "text/plain;charset=UTF-8"],
        ]);
    });

    it("adds all headers when allow origin is not *", async () => {
        const worker = new TestOriginWorker(GET_REQUEST_WITH_ORIGIN);
        const response = await worker.fetch();
        expect([...response.headers.entries()]).toStrictEqual([
            ["access-control-allow-credentials", "true"],
            ["access-control-allow-headers", "Content-Type"],
            ["access-control-allow-methods", "GET, HEAD, OPTIONS"],
            ["access-control-allow-origin", "https://localhost"],
            ["access-control-max-age", "604800"],
            ["content-type", "text/plain;charset=UTF-8"],
            ["vary", "Origin"],
        ]);
    });

    it("adds only select headers when allowed does not contain request origin", async () => {
        const worker = new TestOriginWorker(GET_REQUEST_INVALID_ORIGIN);
        const response = await worker.fetch();
        expect([...response.headers.entries()]).toStrictEqual([
            ["access-control-allow-headers", "Content-Type"],
            ["access-control-allow-methods", "GET, HEAD, OPTIONS"],
            ["access-control-max-age", "604800"],
            ["content-type", "text/plain;charset=UTF-8"],
            ["vary", "Origin"],
        ]);
    });

    it("initializes the cors provider using config object", async () => {
        class TestInitWorker extends TestWorker {
            protected init(): void {
                this.use(new CorsHandler({ allowedHeaders: ["x-test-header"] }));
            }
        }
        const worker = new TestInitWorker(GET_REQUEST_WITH_ORIGIN);
        const response = await worker.fetch();
        expect([...response.headers.entries()]).toStrictEqual([
            ["access-control-allow-headers", "x-test-header"],
            ["access-control-allow-methods", "GET, HEAD, OPTIONS"],
            ["access-control-allow-origin", "*"],
            ["access-control-max-age", "604800"],
            ["content-type", "text/plain;charset=UTF-8"],
        ]);
    });

    it("intercepts the options preflight request and returns the response", async () => {
        const request = new Request(VALID_URL, {
            method: "OPTIONS",
            headers: {
                Origin: VALID_ORIGIN,
            },
        });
        const worker = new TestWorker(request);
        const response = await worker.fetch();
        expect(await response.text()).toBe("");
        expect([...response.headers.entries()]).toStrictEqual([
            ["access-control-allow-headers", "Content-Type"],
            ["access-control-allow-methods", "GET, HEAD, OPTIONS"],
            ["access-control-allow-origin", "*"],
            ["access-control-max-age", "604800"],
        ]);
    });
});
