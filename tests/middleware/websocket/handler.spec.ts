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
import { Method, POST } from "@src/constants/methods";
import { StatusCodes } from "@src/constants";
import { HttpHeader } from "@src/constants/headers";
import { WS_UPGRADE, WS_VERSION, WS_WEBSOCKET } from "@src/middleware/websocket/constants";
import { WebSocketHandler } from "@src/middleware/websocket/handler";

class MockWorker {
    constructor(public request: Request) {}
    getAllowedMethods(): Method[] {
        return ALL_METHODS;
    }
}

async function handleResponse(request: Request, path: string = "/"): Promise<Response> {
    const handler = new WebSocketHandler(path);
    return await handler.handle(new MockWorker(request) as any, async () => new Response("Ok"));
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
        const response = await handleResponse(request);
        expect(response.status).toBe(StatusCodes.OK);
        expect(await response.text()).toBe("Ok");
    });

    it("allows a valid websocket request to pass through provided path", async () => {
        const request = new Request(VALID_ORIGIN + "/connect", {
            headers: {
                [HttpHeader.CONNECTION]: WS_UPGRADE,
                [HttpHeader.UPGRADE]: WS_WEBSOCKET,
                [HttpHeader.SEC_WEBSOCKET_VERSION]: WS_VERSION,
            },
        });
        const response = await handleResponse(request, "/connect");
        expect(response.status).toBe(StatusCodes.OK);
        expect(await response.text()).toBe("Ok");
    });

    it("allows a valid websocket request to pass through path-to-regex path", async () => {
        const request = new Request(VALID_ORIGIN + "/connect/100/chat", {
            headers: {
                [HttpHeader.CONNECTION]: WS_UPGRADE,
                [HttpHeader.UPGRADE]: WS_WEBSOCKET,
                [HttpHeader.SEC_WEBSOCKET_VERSION]: WS_VERSION,
            },
        });

        const response = await handleResponse(request, "/connect/:id/chat");
        expect(response.status).toBe(StatusCodes.OK);
        expect(await response.text()).toBe("Ok");
    });

    it("allows a non-get (post) request to pass through default path", async () => {
        const request = new Request(VALID_ORIGIN, {
            method: POST,
        });
        const response = await handleResponse(request);
        expect(response.status).toBe(StatusCodes.OK);
        expect(await response.text()).toBe("Ok");
    });

    it("allows a get request to pass through if path does not match", async () => {
        const request = new Request(VALID_ORIGIN + "/fetch");
        const response = await handleResponse(request, "/connect");
        expect(response.status).toBe(StatusCodes.OK);
        expect(await response.text()).toBe("Ok");
    });

    it("blocks a websocket request with incorrect connection header", async () => {
        const request = new Request(VALID_ORIGIN, {
            headers: {
                [HttpHeader.CONNECTION]: "invalid",
                [HttpHeader.UPGRADE]: WS_WEBSOCKET,
                [HttpHeader.SEC_WEBSOCKET_VERSION]: WS_VERSION,
            },
        });
        const response = await handleResponse(request);
        expect(await response.json()).toStrictEqual({
            details: "Missing or invalid 'Connection' header",
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
        const response = await handleResponse(request);
        expect(await response.json()).toStrictEqual({
            details: "Missing or invalid 'Upgrade' header",
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
        const response = await handleResponse(request);
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
        const response = await handleResponse(request, "/connect");
        expect(await response.json()).toStrictEqual({
            details: "Missing or invalid 'Upgrade' header",
            error: "Bad Request",
            status: 400,
        });
    });
});
