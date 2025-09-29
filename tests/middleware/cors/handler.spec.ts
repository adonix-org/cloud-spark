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
    expectHeadersEqual,
    GET_REQUEST,
    GET_REQUEST_INVALID_ORIGIN,
    GET_REQUEST_WITH_ORIGIN,
    VALID_ORIGIN,
    VALID_URL,
} from "@common";
import { ctx, env } from "@mock";
import { cors } from "@src/middleware/cors/handler";
import { BasicWorker } from "@src/workers/basic";
import { GET, HEAD, Method, OPTIONS, StatusCodes } from "@src/constants";

class TestWorker extends BasicWorker {
    constructor(request: Request) {
        super(request, env, ctx);
    }

    protected init(): void {
        this.use(cors());
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
        this.use(cors({ allowedOrigins: [VALID_ORIGIN] }));
    }
}

describe("cors middleware unit tests", () => {
    it("returns response with cors headers", async () => {
        const worker = new TestWorker(GET_REQUEST_WITH_ORIGIN);
        const response = await worker.fetch();
        expectHeadersEqual(response.headers, [
            ["access-control-allow-origin", "*"],
            ["content-type", "text/plain;charset=UTF-8"],
        ]);
    });

    it("returns response without cors headers", async () => {
        const worker = new TestWorker(GET_REQUEST);
        const response = await worker.fetch();
        expectHeadersEqual(response.headers, [["content-type", "text/plain;charset=UTF-8"]]);
    });

    it("adds all headers when allow origin is not *", async () => {
        const worker = new TestOriginWorker(GET_REQUEST_WITH_ORIGIN);
        const response = await worker.fetch();
        expectHeadersEqual(response.headers, [
            ["access-control-allow-origin", "https://localhost"],
            ["content-type", "text/plain;charset=UTF-8"],
            ["vary", "Origin"],
        ]);
    });

    it("adds only select headers when allowed does not contain request origin", async () => {
        const worker = new TestOriginWorker(GET_REQUEST_INVALID_ORIGIN);
        const response = await worker.fetch();
        expectHeadersEqual(response.headers, [
            ["content-type", "text/plain;charset=UTF-8"],
            ["vary", "Origin"],
        ]);
    });

    it("initializes the cors provider using config object", async () => {
        class TestInitWorker extends TestWorker {
            protected init(): void {
                this.use(cors({ exposedHeaders: ["x-test-header"] }));
            }
        }
        const worker = new TestInitWorker(GET_REQUEST_WITH_ORIGIN);
        const response = await worker.fetch();
        expectHeadersEqual(response.headers, [
            ["access-control-allow-origin", "*"],
            ["access-control-expose-headers", "x-test-header"],
            ["content-type", "text/plain;charset=UTF-8"],
        ]);
    });

    it("skips cors for no-cors response 3xx", async () => {
        class TestSkipWorker extends TestWorker {
            protected override async get(): Promise<Response> {
                return new Response(null, { status: StatusCodes.PERMANENT_REDIRECT });
            }
        }
        const worker = new TestSkipWorker(GET_REQUEST_WITH_ORIGIN);
        const response = await worker.fetch();
        expectHeadersEqual(response.headers, []);
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
        expectHeadersEqual(response.headers, [
            ["access-control-allow-headers", "Content-Type"],
            ["access-control-allow-origin", "*"],
            ["access-control-max-age", "300"],
        ]);
    });
});
