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

import { describe, it } from "vitest";
import {
    expectHeadersEqual,
    GET_REQUEST,
    GET_REQUEST_INVALID_ORIGIN,
    GET_REQUEST_WITH_ORIGIN,
    VALID_ORIGIN,
    VALID_URL,
} from "@common";
import { GET, HEAD, Method, OPTIONS } from "@src/constants/methods";
import { StatusCodes } from "@src/constants";
import { CorsHandler } from "@src/middleware/cors/handler";
import { CorsInit } from "@src/interfaces";

class MockWorker {
    constructor(public request: Request) {}
    getAllowedMethods(): Method[] {
        return [GET, HEAD, OPTIONS];
    }
}

async function handleResponse(
    request: Request = GET_REQUEST_WITH_ORIGIN,
    response: Response = new Response("Ok"),
    init: CorsInit = {},
): Promise<Response> {
    const handler = new CorsHandler(init);
    return await handler.handle(new MockWorker(request) as any, async () => response);
}

describe("cors middleware unit tests", () => {
    it("returns response with cors headers", async () => {
        const response = await handleResponse();
        expectHeadersEqual(response.headers, [
            ["access-control-allow-origin", "*"],
            ["content-type", "text/plain;charset=UTF-8"],
        ]);
    });

    it("returns response without cors headers", async () => {
        const response = await handleResponse(GET_REQUEST);
        expectHeadersEqual(response.headers, [["content-type", "text/plain;charset=UTF-8"]]);
    });

    it("adds all headers when allow origin is not *", async () => {
        const response = await handleResponse(GET_REQUEST_WITH_ORIGIN, undefined, {
            allowedOrigins: [VALID_ORIGIN],
        });
        expectHeadersEqual(response.headers, [
            ["access-control-allow-origin", "https://localhost"],
            ["content-type", "text/plain;charset=UTF-8"],
            ["vary", "origin"],
        ]);
    });

    it("adds only select headers when allowed does not contain request origin", async () => {
        const response = await handleResponse(GET_REQUEST_INVALID_ORIGIN, undefined, {
            allowedOrigins: [VALID_ORIGIN],
        });
        expectHeadersEqual(response.headers, [
            ["content-type", "text/plain;charset=UTF-8"],
            ["vary", "origin"],
        ]);
    });

    it("initializes the cors provider using config object", async () => {
        const response = await handleResponse(GET_REQUEST_WITH_ORIGIN, undefined, {
            exposedHeaders: ["x-test-header"],
        });
        expectHeadersEqual(response.headers, [
            ["access-control-allow-origin", "*"],
            ["access-control-expose-headers", "x-test-header"],
            ["content-type", "text/plain;charset=UTF-8"],
        ]);
    });

    it("skips cors for no-cors response 3xx", async () => {
        const response = await handleResponse(
            GET_REQUEST_WITH_ORIGIN,
            new Response(null, { status: StatusCodes.PERMANENT_REDIRECT }),
        );
        expectHeadersEqual(response.headers, []);
    });

    it("appends cors options to the default options response", async () => {
        const request = new Request(VALID_URL, {
            method: "OPTIONS",
            headers: {
                Origin: VALID_ORIGIN,
            },
        });
        const response = await handleResponse(request);
        expectHeadersEqual(response.headers, [
            ["access-control-allow-headers", "content-type"],
            ["access-control-allow-methods", "GET, HEAD, OPTIONS"],
            ["access-control-allow-origin", "*"],
            ["access-control-max-age", "300"],
            ["content-type", "text/plain;charset=UTF-8"],
        ]);
    });
});
