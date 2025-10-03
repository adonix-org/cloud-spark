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
    R2ObjectStream,
    NotModified,
} from "@src/responses";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { assertDefined, expectHeadersEqual, VALID_URL } from "./test-utils/common";
import { MethodNotAllowed } from "@src/errors";
import { FORBIDDEN_204_HEADERS, FORBIDDEN_304_HEADERS, HttpHeader } from "@src/constants/headers";
import { CacheControl } from "@src/constants/cache";
import { MediaType } from "@src/constants/media";

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

    it("returns null body for 204 No Content", async () => {
        const resp = new SuccessResponse("Some body", undefined, StatusCodes.NO_CONTENT);
        const r = await resp.response();
        expect(await r.text()).toBe(""); // body should be null
        FORBIDDEN_204_HEADERS.forEach((h) => expect(r.headers.has(h)).toBe(false));
    });

    it("returns null body for 304 Not Modified", async () => {
        const resp = new SuccessResponse("Some body", undefined, StatusCodes.NOT_MODIFIED);
        const r = await resp.response();
        expect(await r.text()).toBe(""); // body should be null
        FORBIDDEN_304_HEADERS.forEach((h) => expect(r.headers.has(h)).toBe(false));
    });

    it("preserves custom headers for 204/304", async () => {
        const resp204 = new SuccessResponse(null, undefined, StatusCodes.NO_CONTENT);
        resp204.setHeader("X-Custom", "keep-me");
        const r204 = await resp204.response();
        expect(r204.headers.get("X-Custom")).toBe("keep-me");

        const resp304 = new SuccessResponse(null, undefined, StatusCodes.NOT_MODIFIED);
        resp304.setHeader("X-Custom", "keep-me");
        const r304 = await resp304.response();
        expect(r304.headers.get("X-Custom")).toBe("keep-me");
    });

    it("does not overwrite existing content type", async () => {
        const resp = new SuccessResponse("hi");
        resp.setHeader(HttpHeader.CONTENT_TYPE, "text/custom");
        const r = await resp.response();
        expect(r.headers.get(HttpHeader.CONTENT_TYPE)).toBe("text/custom");
    });

    it("sets correct status text if provided", async () => {
        const resp = new SuccessResponse("hi", undefined, StatusCodes.OK);
        resp.statusText = "All Good";
        const r = await resp.response();
        expect(r.statusText).toBe("All Good");
    });

    it("defaults status text to standard reason phrase", async () => {
        const resp = new SuccessResponse("hi", undefined, StatusCodes.NOT_FOUND);
        const r = await resp.response();
        expect(r.statusText).toBe(getReasonPhrase(StatusCodes.NOT_FOUND));
    });

    it("adds content type for non-null body", async () => {
        const resp = new SuccessResponse("hello");
        const r = await resp.response();
        expect(r.headers.get(HttpHeader.CONTENT_TYPE)).toBe(resp.mediaType);
    });

    it("does not add content type for 204 no content or 304 not modified", async () => {
        const resp204 = new SuccessResponse("hi", undefined, StatusCodes.NO_CONTENT);
        const r204 = await resp204.response();
        expect(r204.headers.has(HttpHeader.CONTENT_TYPE)).toBe(false);

        const resp304 = new SuccessResponse("hi", undefined, StatusCodes.NOT_MODIFIED);
        const r304 = await resp304.response();
        expect(r304.headers.has(HttpHeader.CONTENT_TYPE)).toBe(false);
    });

    it("clones the provided response for 304 not modified", async () => {
        const resp = new SuccessResponse("hi", { public: true, "max-age": 60 });
        resp.headers.set("x-test-header-1", "123");
        resp.headers.set("x-test-header-2", "345");

        const resp304 = await new NotModified(await resp.response()).response();
        expect(resp304.status).toBe(StatusCodes.NOT_MODIFIED);
        expect(resp304.statusText).toBe("Not Modified");
        expect(await resp304.text()).toBe("");
        expectHeadersEqual(resp304.headers, [
            ["cache-control", "public, max-age=60"],
            ["x-test-header-1", "123"],
            ["x-test-header-2", "345"],
        ]);
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

        it("offset = 0 and length = size behaves as partial if explicitly set", () => {
            const size = 10;
            const init = { size, offset: 0, length: 10 };
            const stream = createDummyStream();

            const octet = new OctetStream(stream, init);

            expect(octet.headers.get(HttpHeader.CONTENT_LENGTH)).toBe("10");
            expect(octet.status).toBe(StatusCodes.OK);
            expect(octet.headers.get(HttpHeader.CONTENT_RANGE)).toBeNull();
        });

        it("does not change length if positive", () => {
            const size = 10;
            const init = { size, offset: 2, length: 3 };
            const stream = new ReadableStream();

            const octet = new OctetStream(stream, init);

            expect(octet.headers.get("Content-Length")).toBe("3");
            expect(octet.status).toBe(206);
        });

        it("offset > 0 with length = 0 returns zero-length 206", () => {
            const size = 1024;
            const init = { size, offset: 256, length: 0 };
            const stream = createDummyStream();

            const octet = new OctetStream(stream, init);

            expect(octet.headers.get("Content-Length")).toBe("0");
            expect(octet.status).toBe(StatusCodes.PARTIAL_CONTENT);
            expect(octet.headers.get(HttpHeader.CONTENT_RANGE)).toBe("bytes 256-255/1024");
        });

        it("offset = size with length = 0 returns zero-length 206", () => {
            const size = 10;
            const init = { size, offset: 10, length: 0 };
            const stream = createDummyStream();

            const octet = new OctetStream(stream, init);

            expect(octet.headers.get("Content-Length")).toBe("0");
            expect(octet.status).toBe(StatusCodes.PARTIAL_CONTENT);
            expect(octet.headers.get(HttpHeader.CONTENT_RANGE)).toBe("bytes 10-9/10");
        });

        it("length omitted with offset > 0 defaults to size - offset", () => {
            const size = 10;
            const init = { size, offset: 4 }; // length omitted
            const stream = createDummyStream();

            const octet = new OctetStream(stream, init);

            expect(octet.headers.get("Content-Length")).toBe("6"); // 10 - 4
            expect(octet.status).toBe(StatusCodes.PARTIAL_CONTENT);
            expect(octet.headers.get(HttpHeader.CONTENT_RANGE)).toBe("bytes 4-9/10");
        });

        it("length = 0 and size = 0 remains zero-length", () => {
            const init = { size: 0, offset: 0, length: 0 };
            const stream = createDummyStream();

            const octet = new OctetStream(stream, init);

            expect(octet.headers.get(HttpHeader.CONTENT_LENGTH)).toBe("0");
            expect(octet.status).toBe(StatusCodes.OK);
            expect(octet.headers.get(HttpHeader.CONTENT_RANGE)).toBeNull();
        });

        it("range 0-0 and size > 0 is one byte partial", () => {
            const init = { size: 10, offset: 0, length: 0 };
            const stream = createDummyStream();

            const octet = new OctetStream(stream, init);

            expect(octet.headers.get(HttpHeader.CONTENT_LENGTH)).toBe("1");
            expect(octet.status).toBe(StatusCodes.PARTIAL_CONTENT);
            expect(octet.headers.get(HttpHeader.CONTENT_RANGE)).toBe("bytes 0-0/10");
        });

        it("range 0-1 and size > 0 is two byte partial", () => {
            const init = { size: 10, offset: 0, length: 2 };
            const stream = createDummyStream();

            const octet = new OctetStream(stream, init);

            expect(octet.headers.get(HttpHeader.CONTENT_LENGTH)).toBe("2");
            expect(octet.status).toBe(StatusCodes.PARTIAL_CONTENT);
            expect(octet.headers.get(HttpHeader.CONTENT_RANGE)).toBe("bytes 0-1/10");
        });
    });

    describe("r2 object stream unit tests", () => {
        function createDummyStream(): ReadableStream {
            return new ReadableStream({
                start(controller) {
                    controller.enqueue(new Uint8Array([1, 2, 3]));
                    controller.close();
                },
            });
        }

        it("should set full content headers for a complete object with no range", () => {
            const stream = createDummyStream();
            const obj = { body: stream, size: 3, httpEtag: "123" } as any;
            const r2stream = new R2ObjectStream(obj);

            expect(r2stream.status).toBe(StatusCodes.OK);
            expect(r2stream.mediaType).toBe(MediaType.OCTET_STREAM);
            expect(r2stream.headers.get(HttpHeader.ACCEPT_RANGES)).toBe("bytes");
            expect(r2stream.headers.get(HttpHeader.CONTENT_LENGTH)).toBe("3");
            expect(r2stream.headers.get(HttpHeader.CONTENT_RANGE)).toBeNull();
        });

        it("should set partial content headers for a standard offset/length range", () => {
            const stream = createDummyStream();
            const obj = {
                body: stream,
                size: 10,
                range: { offset: 2, length: 5 },
                httpEtag: "123",
            } as any;
            const r2stream = new R2ObjectStream(obj);

            expect(r2stream.status).toBe(StatusCodes.PARTIAL_CONTENT);
            expect(r2stream.headers.get(HttpHeader.CONTENT_LENGTH)).toBe("5");
            expect(r2stream.headers.get(HttpHeader.CONTENT_RANGE)).toBe("bytes 2-6/10");
            expect(r2stream.headers.get(HttpHeader.ETAG)).toBe("123");
        });

        it("should set partial content headers for a suffix range", () => {
            const stream = createDummyStream();
            const obj = { body: stream, size: 10, range: { suffix: 4 }, httpEtag: "123" } as any;
            const r2stream = new R2ObjectStream(obj);

            expect(r2stream.status).toBe(StatusCodes.PARTIAL_CONTENT);
            expect(r2stream.headers.get(HttpHeader.CONTENT_LENGTH)).toBe("4");
            expect(r2stream.headers.get(HttpHeader.CONTENT_RANGE)).toBe("bytes 6-9/10");
            expect(r2stream.headers.get(HttpHeader.ETAG)).toBe("123");
        });

        it("should set media type from object.httpMetadata if present", () => {
            const stream = createDummyStream();
            const obj = {
                body: stream,
                size: 5,
                httpMetadata: { contentType: "audio/mpeg" },
                httpEtag: "123",
            } as any;
            const r2stream = new R2ObjectStream(obj);

            expect(r2stream.mediaType).toBe("audio/mpeg");
        });

        it("should handle offset 0 but length < size as partial content", () => {
            const stream = createDummyStream();
            const obj = { body: stream, size: 10, range: { length: 5 }, httpEtag: "123" } as any;
            const r2stream = new R2ObjectStream(obj);

            expect(r2stream.status).toBe(StatusCodes.PARTIAL_CONTENT);
            expect(r2stream.headers.get(HttpHeader.CONTENT_LENGTH)).toBe("5");
            expect(r2stream.headers.get(HttpHeader.CONTENT_RANGE)).toBe("bytes 0-4/10");
            expect(r2stream.headers.get(HttpHeader.ETAG)).toBe("123");
        });

        it("should handle empty objects correctly", () => {
            const emptyStream = new ReadableStream();
            const obj = { body: emptyStream, size: 0, httpEtag: "123" } as any;
            const r2stream = new R2ObjectStream(obj);

            expect(r2stream.status).toBe(StatusCodes.OK);
            expect(r2stream.headers.get(HttpHeader.CONTENT_LENGTH)).toBe("0");
            expect(r2stream.headers.get(HttpHeader.ACCEPT_RANGES)).toBe("bytes");
            expect(r2stream.headers.get(HttpHeader.CONTENT_RANGE)).toBeNull();
            expect(r2stream.headers.get(HttpHeader.ETAG)).toBe("123");
        });

        it("should use the constructor cache if present", () => {
            const stream = createDummyStream();
            const obj = {
                body: stream,
                size: 5,
                httpMetadata: { cacheControl: "public, max-age=3600" },
                httpEtag: "123",
            } as any;
            const r2stream = new R2ObjectStream(obj, { private: true, "max-age": 0 });

            expect(r2stream.cache).toStrictEqual({
                "max-age": 0,
                private: true,
            });
        });

        it("should use the r2 cache if present", () => {
            const stream = createDummyStream();
            const obj = {
                body: stream,
                size: 5,
                httpMetadata: { cacheControl: "public, max-age=3600" },
                httpEtag: "123",
            } as any;
            const r2stream = new R2ObjectStream(obj);

            expect(r2stream.cache).toStrictEqual({
                "max-age": 3600,
                public: true,
            });
        });

        it("does not set cache if neither are present", () => {
            const stream = createDummyStream();
            const obj = {
                body: stream,
                size: 5,
                httpEtag: "123",
            } as any;
            const r2stream = new R2ObjectStream(obj);

            expect(r2stream.cache).toBeUndefined();
        });
    });
});
