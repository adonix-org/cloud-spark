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
import {
    SuccessResponse,
    JsonResponse,
    HtmlResponse,
    TextResponse,
    ClonedResponse,
    Head,
    WebSocketUpgrade,
    OctetStream,
} from "@src/responses";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { assertDefined, VALID_URL } from "./test-utils/common";
import { MethodNotAllowed } from "@src/errors";
import { HttpHeader } from "@src/constants/http";
import { CacheControl } from "@src/constants/cache";
import { MediaType } from "@src/constants/media-types";

const mockWorker = {
    request: new Request(VALID_URL),
    allowAnyOrigin: vi.fn(() => false),
    getAllowedMethods: vi.fn(() => ["GET", "HEAD", "OPTIONS"]),
} as any;

describe("response unit tests", () => {
    it("sets status and body in success response", async () => {
        const resp = new SuccessResponse("Hello", undefined, StatusCodes.CREATED);
        const r = await resp.response();
        expect(r.status).toBe(StatusCodes.CREATED);
        expect(r.statusText).toBe(getReasonPhrase(StatusCodes.CREATED));
    });

    it("sets json body and content-type in json response", async () => {
        const resp = new JsonResponse({ foo: "bar" });
        const r = await resp.response();
        expect(r.headers.get(HttpHeader.CONTENT_TYPE)).toBe("application/json; charset=utf-8");
        const json = await r.json();
        expect(json).toEqual({ foo: "bar" });
    });

    it("sets content type to text/html in html response", async () => {
        const resp = new HtmlResponse("<p>Hello</p>");
        const r = await resp.response();
        expect(r.headers.get(HttpHeader.CONTENT_TYPE)).toBe("text/html; charset=utf-8");
        const text = await r.text();
        expect(text).toBe("<p>Hello</p>");
    });

    it("sets content type to text/plain in text response", async () => {
        const resp = new TextResponse("Hello");
        const r = await resp.response();
        expect(r.headers.get(HttpHeader.CONTENT_TYPE)).toBe("text/plain; charset=utf-8");
        const text = await r.text();
        expect(text).toBe("Hello");
    });

    it("clones response headers and body in cloned response", async () => {
        const original = new Response("Test", {
            headers: { "X-Test": "ok" },
            status: StatusCodes.ACCEPTED,
        });
        const resp = new ClonedResponse(original);
        const r = await resp.response();
        expect(r.status).toBe(StatusCodes.ACCEPTED);
        expect(r.headers.get("X-Test")).toBe("ok");
        expect(await r.text()).toBe("Test");
    });

    it("returns headers but empty body in head response", async () => {
        const original = new Response("Hello", { headers: { "X-Test": "ok" } });
        const resp = new Head(original);
        const r = await resp.response();
        expect(r.headers.get("X-Test")).toBe("ok");
        expect(await r.text()).toBe("");
    });

    it("sets cache header if defined", async () => {
        const cache: CacheControl = { "max-age": 65 };
        const resp = new JsonResponse({ foo: "bar" }, cache);
        const r = await resp.response();

        const h = assertDefined(
            r.headers.get(HttpHeader.CACHE_CONTROL),
            "cache header not defined",
        );

        expect(CacheControl.parse(h)["max-age"]).toBe(65);
    });

    it("correctly merges a value to an existing header", async () => {
        const resp = new MethodNotAllowed(mockWorker);
        resp.mergeHeader(HttpHeader.ALLOW, "DELETE");
        expect(resp.headers.get(HttpHeader.ALLOW)).toBe("DELETE, GET, HEAD, OPTIONS");
    });

    it("sets the status to 101 in web socket response", async () => {
        class DummyWebSocket {
            dummy = true;
        }
        const ws = new DummyWebSocket() as any;
        const resp = new WebSocketUpgrade(ws);
        expect(resp.status).toBe(StatusCodes.SWITCHING_PROTOCOLS);
        expect(resp.webSocket).toBe(ws);
    });

    describe("octet stream unit tests", () => {
        function createDummyStream(): ReadableStream {
            return new ReadableStream({
                start(controller) {
                    controller.enqueue(new Uint8Array([1, 2, 3]));
                    controller.close();
                },
            });
        }

        it("should set full content headers for a complete stream", () => {
            const stream = createDummyStream();
            const octet = new OctetStream(stream, { size: 3 });

            expect(octet.status).toBe(StatusCodes.OK);
            expect(octet.mediaType).toBe(MediaType.OCTET_STREAM);
            expect(octet.headers.get(HttpHeader.ACCEPT_RANGES)).toBe("bytes");
            expect(octet.headers.get(HttpHeader.CONTENT_LENGTH)).toBe("3");
            expect(octet.headers.get(HttpHeader.CONTENT_RANGE)).toBeNull();
        });

        it("should set partial content headers when offset and length are provided", () => {
            const stream = createDummyStream();
            const octet = new OctetStream(stream, { size: 10, offset: 2, length: 5 });

            expect(octet.status).toBe(StatusCodes.PARTIAL_CONTENT);
            expect(octet.headers.get(HttpHeader.ACCEPT_RANGES)).toBe("bytes");
            expect(octet.headers.get(HttpHeader.CONTENT_LENGTH)).toBe("5");
            expect(octet.headers.get(HttpHeader.CONTENT_RANGE)).toBe("bytes 2-6/10");
        });

        it("should default offset to 0 and length to size when not provided", () => {
            const stream = createDummyStream();
            const octet = new OctetStream(stream, { size: 7 });

            expect(octet.status).toBe(StatusCodes.OK);
            expect(octet.headers.get(HttpHeader.CONTENT_LENGTH)).toBe("7");
        });

        it("should set partial content when offset is 0 but length < size", () => {
            const stream = createDummyStream();
            const octet = new OctetStream(stream, { size: 10, length: 5 });

            expect(octet.status).toBe(StatusCodes.PARTIAL_CONTENT);
            expect(octet.headers.get(HttpHeader.CONTENT_LENGTH)).toBe("5");
            expect(octet.headers.get(HttpHeader.CONTENT_RANGE)).toBe("bytes 0-4/10");
        });

        it("should handle empty streams correctly", () => {
            const emptyStream = new ReadableStream();
            const octet = new OctetStream(emptyStream, { size: 0 });

            expect(octet.status).toBe(StatusCodes.OK);
            expect(octet.headers.get(HttpHeader.CONTENT_LENGTH)).toBe("0");
            expect(octet.headers.get(HttpHeader.ACCEPT_RANGES)).toBe("bytes");
            expect(octet.headers.get(HttpHeader.CONTENT_RANGE)).toBeNull();
        });

        it("should store cache object in WorkerResponse", () => {
            const dummyCache: CacheControl = { "max-age": 60 };
            const stream = createDummyStream();
            const octet = new OctetStream(stream, { size: 3 }, dummyCache);

            expect(octet.cache).toBe(dummyCache);
        });
    });
});
