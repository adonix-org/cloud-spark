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
import { ALL_METHODS, VALID_ORIGIN } from "@common";
import { ctx, env } from "@mock";
import { BasicWorker } from "@src/workers/basic";
import { websocket } from "@src/middleware/websocket/handler";
import { Method, POST } from "@src/constants/methods";
import { StatusCodes, WS_UPGRADE, WS_VERSION, WS_WEBSOCKET } from "@src/constants";
import { HttpHeader } from "@src/constants/headers";

const GET_DISPATCH = "GET Dispatch";
const POST_DISPATCH = "POST Dispatch";

class TestWorker extends BasicWorker {
    constructor(
        request: Request,
        public readonly path = "/",
    ) {
        super(request, env, ctx);
    }
    protected init(): void {
        this.use(websocket(this.path));
    }

    protected override async get(): Promise<Response> {
        return new Response(GET_DISPATCH);
    }

    protected override async post(): Promise<Response> {
        return new Response(POST_DISPATCH);
    }

    public override getAllowedMethods(): Method[] {
        return ALL_METHODS;
    }
}

describe("websocket middleware unit tests", () => {
    it("allows a valid websocket request to pass through default path", async () => {
        const request = new Request(VALID_ORIGIN, {
            headers: {
                [HttpHeader.CONNECTION]: WS_UPGRADE,
                [HttpHeader.UPGRADE]: WS_WEBSOCKET,
                [HttpHeader.SEC_WEBSOCKET_VERSION]: WS_VERSION,
            },
        });
        const worker = new TestWorker(request);
        const response = await worker.fetch();
        expect(response.status).toBe(StatusCodes.OK);
        expect(await response.text()).toBe(GET_DISPATCH);
    });

    it("allows a valid websocket request to pass through provided path", async () => {
        const request = new Request(VALID_ORIGIN + "/connect", {
            headers: {
                [HttpHeader.CONNECTION]: WS_UPGRADE,
                [HttpHeader.UPGRADE]: WS_WEBSOCKET,
                [HttpHeader.SEC_WEBSOCKET_VERSION]: WS_VERSION,
            },
        });
        const worker = new TestWorker(request, "/connect");
        const response = await worker.fetch();
        expect(response.status).toBe(StatusCodes.OK);
        expect(await response.text()).toBe(GET_DISPATCH);
    });

    it("allows a non-get (post) request to pass through default path", async () => {
        const request = new Request(VALID_ORIGIN, {
            method: POST,
        });
        const worker = new TestWorker(request);
        const response = await worker.fetch();
        expect(response.status).toBe(StatusCodes.OK);
        expect(await response.text()).toBe(POST_DISPATCH);
    });

    it("allows a get request to pass through if path does not match", async () => {
        const request = new Request(VALID_ORIGIN + "/fetch");
        const worker = new TestWorker(request, "/connect");
        const response = await worker.fetch();
        expect(response.status).toBe(StatusCodes.OK);
        expect(await response.text()).toBe(GET_DISPATCH);
    });

    it("blocks a websocket request with incorrect connection header", async () => {
        const request = new Request(VALID_ORIGIN, {
            headers: {
                [HttpHeader.CONNECTION]: "invalid",
                [HttpHeader.UPGRADE]: WS_WEBSOCKET,
                [HttpHeader.SEC_WEBSOCKET_VERSION]: WS_VERSION,
            },
        });
        const worker = new TestWorker(request);
        const response = await worker.fetch();
        expect(await response.json()).toStrictEqual({
            details: "Missing or invalid Connection header",
            error: "Bad Request",
            status: 400,
        });
    });

    it("blocks a websocket request with incorrect upgrade header", async () => {
        const request = new Request(VALID_ORIGIN, {
            headers: {
                [HttpHeader.CONNECTION]: WS_UPGRADE,
                [HttpHeader.UPGRADE]: "invalid",
                [HttpHeader.SEC_WEBSOCKET_VERSION]: WS_VERSION,
            },
        });
        const worker = new TestWorker(request);
        const response = await worker.fetch();
        expect(await response.json()).toStrictEqual({
            details: "Missing or invalid Upgrade header",
            error: "Bad Request",
            status: 400,
        });
    });

    it("blocks a websocket request with incorrect version header", async () => {
        const request = new Request(VALID_ORIGIN, {
            headers: {
                [HttpHeader.CONNECTION]: WS_UPGRADE,
                [HttpHeader.UPGRADE]: WS_WEBSOCKET,
                [HttpHeader.SEC_WEBSOCKET_VERSION]: "12",
            },
        });
        const worker = new TestWorker(request);
        const response = await worker.fetch();
        expect(await response.json()).toStrictEqual({
            details: "",
            error: "Upgrade Required",
            status: 426,
        });
    });

    it("blocks a websocket request with incorrect upgrade header on non-default path", async () => {
        const request = new Request(VALID_ORIGIN + "/connect", {
            headers: {
                [HttpHeader.CONNECTION]: WS_UPGRADE,
                [HttpHeader.UPGRADE]: "invalid",
                [HttpHeader.SEC_WEBSOCKET_VERSION]: WS_VERSION,
            },
        });
        const worker = new TestWorker(request, "/connect");
        const response = await worker.fetch();
        expect(await response.json()).toStrictEqual({
            details: "Missing or invalid Upgrade header",
            error: "Bad Request",
            status: 400,
        });
    });
});
