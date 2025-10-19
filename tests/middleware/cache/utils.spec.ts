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

import { decodeVaryKey, VALID_URL } from "@common";
import { HttpHeader } from "@src/constants/headers";
import { GET, POST } from "@src/constants/methods";
import {
    base64UrlEncode,
    getFilteredVary,
    getVaryHeader,
    getVaryKey,
    isCacheable,
    normalizeVaryValue,
} from "@src/middleware/cache/utils";
import { StatusCodes } from "http-status-codes";
import { describe, expect, it } from "vitest";

describe("cache utils unit tests ", () => {
    describe("is cacheable function", () => {
        const makeRequest = (method = GET, headers: Record<string, string> = {}) =>
            new Request(VALID_URL, { method, headers });

        const makeResponse = (status = StatusCodes.OK, headers: Record<string, string> = {}) =>
            new Response("", { status, headers });

        it("returns false if response status is not 200", () => {
            const req = makeRequest();
            const resp = makeResponse(StatusCodes.CREATED);
            expect(isCacheable(req, resp)).toBe(false);
        });

        it("returns false if request method is not GET", () => {
            const req = makeRequest(POST);
            const resp = makeResponse();
            expect(isCacheable(req, resp)).toBe(false);
        });

        it("returns false if vary header contains *", () => {
            const req = makeRequest();
            const resp = makeResponse(StatusCodes.OK, { "Cache-Control": "max-age=60", Vary: "*" });
            expect(isCacheable(req, resp)).toBe(false);
        });

        it("returns false if request cache-control contains no-store", () => {
            const req = makeRequest(GET, { "Cache-Control": "no-store" });
            const resp = makeResponse();
            expect(isCacheable(req, resp)).toBe(false);
        });

        it("returns false if response cache-control not present", () => {
            const req = makeRequest(GET);
            const resp = makeResponse();
            expect(isCacheable(req, resp)).toBe(false);
        });

        it("returns false if response cache-control max-age or s-maxage not present", () => {
            const req = makeRequest(GET);
            const resp = makeResponse(StatusCodes.OK, { "Cache-Control": "public" });
            expect(isCacheable(req, resp)).toBe(false);
        });

        it("returns false if response cache-control max-age is 0", () => {
            const req = makeRequest();
            const resp = makeResponse(StatusCodes.OK, { "Cache-Control": "max-age=0" });
            expect(isCacheable(req, resp)).toBe(false);
        });

        it("returns false if response cache-control contains private", () => {
            const req = makeRequest();
            const resp = makeResponse(StatusCodes.OK, { "Cache-Control": "private, max-age=60" });
            expect(isCacheable(req, resp)).toBe(false);
        });

        it("returns false if response cache-control contains no-store", () => {
            const req = makeRequest();
            const resp = makeResponse(StatusCodes.OK, { "Cache-Control": "no-store, max-age=1" });
            expect(isCacheable(req, resp)).toBe(false);
        });

        it("returns false if response cache-control contains no-cache", () => {
            const req = makeRequest();
            const resp = makeResponse(StatusCodes.OK, { "Cache-Control": "no-cache, max-age=1" });
            expect(isCacheable(req, resp)).toBe(false);
        });

        it("throws an error if response has content-range header", () => {
            const req = makeRequest();
            const resp = makeResponse(StatusCodes.OK, {
                "Cache-Control": "max-age=60",
                "Content-Range": "bytes 0-99/100",
            });
            expect(() => isCacheable(req, resp)).toThrow();
        });

        it("returns false if request has Cookie header", () => {
            const req = makeRequest(GET, { Cookie: "session=abc123" });
            const resp = makeResponse(StatusCodes.OK, { "Cache-Control": "public, max-age=3600" });
            expect(isCacheable(req, resp)).toBe(false);
        });

        it("returns false if request has Authorization header", () => {
            const req = makeRequest(GET, { Authorization: "Bearer token" });
            const resp = makeResponse(StatusCodes.OK, { "Cache-Control": "public, max-age=3600" });
            expect(isCacheable(req, resp)).toBe(false);
        });

        it("returns false if response has Set-Cookie header", () => {
            const req = makeRequest();
            const resp = makeResponse(StatusCodes.OK, {
                "Cache-Control": "public, max-age=3600",
                "Set-Cookie": "session=abc123; Path=/",
            });
            expect(isCacheable(req, resp)).toBe(false);
        });

        it("returns true for standard cacheable GET 200 response", () => {
            const req = makeRequest();
            const resp = makeResponse(StatusCodes.OK, { "Cache-Control": "public, max-age=3600" });
            expect(isCacheable(req, resp)).toBe(true);
        });

        it("handles multiple cache-control directives correctly", () => {
            const req = makeRequest();
            const resp = makeResponse(StatusCodes.OK, {
                "Cache-Control": "public, max-age=3600, immutable",
            });
            expect(isCacheable(req, resp)).toBe(true);
        });

        it("returns false for requests with multiple cache-control directives including no-store", () => {
            const req = makeRequest(GET, { "Cache-Control": "max-age=0, no-cache, no-store" });
            const resp = makeResponse();
            expect(isCacheable(req, resp)).toBe(false);
        });

        it("returns false for responses with multiple cache-control directives including private or no-store", () => {
            const req = makeRequest();
            const resp = makeResponse(StatusCodes.OK, {
                "Cache-Control": "public, max-age=3600, no-store",
            });
            expect(isCacheable(req, resp)).toBe(false);
        });
    });

    describe("get vary header function", () => {
        it("returns single value lowercased", () => {
            const headers = new Headers({ Vary: "Origin" });
            const response = new Response(null, { headers });

            expect(getVaryHeader(response)).toEqual(["origin"]);
        });

        it("splits multiple comma-separated values and sorts them", () => {
            const headers = new Headers({ Vary: "Origin, Accept-Language, " });
            const response = new Response(null, { headers });

            expect(getVaryHeader(response)).toEqual(["accept-language", "origin"]);
        });

        it("deduplicates repeated values", () => {
            const headers = new Headers({
                Vary: "Origin, origin, ACCEPT-LANGUAGE, accept-language",
            });
            const response = new Response(null, { headers });

            expect(getVaryHeader(response)).toEqual(["accept-language", "origin"]);
        });

        it("filters accept-encoding values", () => {
            const headers = new Headers({
                Vary: "Origin, origin, ACCEPT-ENCODING, accept-encoding",
            });
            const response = new Response(null, { headers });

            expect(getVaryHeader(response)).toEqual(["origin"]);
        });

        it("returns empty array if vary header is missing", () => {
            const headers = new Headers();
            const response = new Response(null, { headers });

            expect(getVaryHeader(response)).toEqual([]);
        });

        it("handles mixed whitespace and sorts lexicographically", () => {
            const headers = new Headers({ Vary: "  zeta , alpha , Beta " });
            const response = new Response(null, { headers });

            expect(getVaryHeader(response)).toEqual(["alpha", "beta", "zeta"]);
        });
    });

    describe("filter vary header function", () => {
        it("removes 'accept-encoding' when it is the only header", () => {
            const input = ["Accept-Encoding"];
            expect(getFilteredVary(input)).toEqual([]);
        });

        it("removes 'accept-encoding' among other headers", () => {
            const input = ["Origin", "Accept-Encoding", "Content-Type"];
            expect(getFilteredVary(input)).toEqual(["content-type", "origin"]);
        });

        it("removes 'accept-encoding' case-insensitively", () => {
            const input = ["origin", "ACCEPT-ENCODING", "content-type"];
            expect(getFilteredVary(input)).toEqual(["content-type", "origin"]);
        });

        it("returns lowercased headers if none are 'accept-encoding'", () => {
            const input = ["Origin", "Content-Type"];
            expect(getFilteredVary(input)).toEqual(["content-type", "origin"]);
        });

        it("returns empty array if input is empty", () => {
            expect(getFilteredVary([])).toEqual([]);
        });

        it("works if input has duplicates of 'accept-encoding'", () => {
            const input = ["Accept-Encoding", "ACCEPT-ENCODING"];
            expect(getFilteredVary(input)).toEqual([]);
        });
    });

    describe("get vary key function", () => {
        it("produces different keys for different header values", () => {
            const url = new URL("https://example.com/foo");
            const requestA = new Request(url, { headers: { Accept: "text/html" } });
            const requestB = new Request(url, { headers: { Accept: "application/json" } });

            const vary = ["Accept"];
            const keyA = getVaryKey(requestA, vary, url);
            const keyB = getVaryKey(requestB, vary, url);

            const decodedA = decodeVaryKey(keyA);
            const decodedB = decodeVaryKey(keyB);

            expect(decodedA.vary).not.toEqual(decodedB.vary);
        });

        it("ignores accept-encoding in vary headers", () => {
            const url = new URL("https://example.com/foo");
            const request = new Request(url, {
                headers: { "Accept-Encoding": "gzip", Accept: "text/html" },
            });
            const vary = ["Accept", HttpHeader.ACCEPT_ENCODING];

            const key = getVaryKey(request, vary, url);
            const decoded = decodeVaryKey(key);

            const headersInKey = decoded.vary.map(([header]) => header);
            expect(headersInKey).toContain("accept");
            expect(headersInKey).not.toContain("accept-encoding");
        });

        it("produces same key regardless of vary header order", () => {
            const url = new URL("https://example.com/foo");
            const request = new Request(url, { headers: { "X-Foo": "1", "X-Bar": "2" } });

            const vary1 = ["X-Foo", "X-Bar"];
            const vary2 = ["X-Bar", "X-Foo"];

            const key1 = getVaryKey(request, vary1, url);
            const key2 = getVaryKey(request, vary2, url);

            expect(key1).toBe(key2);

            const decoded1 = decodeVaryKey(key1);
            const decoded2 = decodeVaryKey(key2);

            expect(decoded1.vary).toEqual(decoded2.vary);
        });

        it("produces same key for empty vary headers", () => {
            const url = new URL("https://example.com/foo");
            const request = new Request(url);

            const key1 = getVaryKey(request, [], url);
            const key2 = getVaryKey(request, [], url);

            expect(key1).toBe(key2);

            const decoded1 = decodeVaryKey(key1);
            const decoded2 = decodeVaryKey(key2);

            expect(decoded1.vary).toEqual([]);
            expect(decoded1.url).toBe(decoded2.url);
            expect(decoded1.search).toBe(decoded2.search);
        });

        it("handles non-ascii characters in URL and headers", () => {
            const url = new URL("https://example.com/foö?x=ü");
            const request = new Request(url, { headers: { "X-Custom": "ñ" } });
            const vary = ["X-Custom"];

            const key = getVaryKey(request, vary, url);
            const decoded = decodeVaryKey(key);

            expect(decoded.url).toBe("https://example.com/fo%C3%B6");
            expect(decoded.vary).toEqual([["x-custom", "ñ"]]);
            expect(decoded.search).toBe("x=%C3%BC");
        });

        it("works with empty query string", () => {
            const url = new URL("https://example.com/foo");
            const request = new Request(url, { headers: { Accept: "text/html" } });
            const vary = ["Accept"];

            const key = getVaryKey(request, vary, url);
            const decoded = decodeVaryKey(key);

            expect(decoded.search).toBe("");
        });
    });

    describe("normalize vary value function", () => {
        it("lowercases values for accept header", () => {
            expect(normalizeVaryValue(HttpHeader.ACCEPT, "TEXT/HTML")).toBe("text/html");
            expect(normalizeVaryValue("AcCePt", "ApPlIcAtIoN/JSON")).toBe("application/json");
            expect(normalizeVaryValue(HttpHeader.ACCEPT, "image/Avif")).toBe("image/avif");
        });

        it("lowercases values for accept-language header", () => {
            expect(normalizeVaryValue(HttpHeader.ACCEPT_LANGUAGE, "EN-US")).toBe("en-us");
            expect(normalizeVaryValue("accept-language", "fr-FR")).toBe("fr-fr");
            expect(normalizeVaryValue("ACCEPT-LANGUAGE", "fr-ÇA")).toBe("fr-ça");
        });

        it("lowercases values for origin header", () => {
            expect(normalizeVaryValue(HttpHeader.ORIGIN, "HTTPS://EXAMPLE.COM")).toBe(
                "https://example.com",
            );
            expect(normalizeVaryValue("origin", "http://foo.bar")).toBe("http://foo.bar");
        });

        it("does not modify other headers", () => {
            expect(normalizeVaryValue("user-agent", "Chrome")).toBe("Chrome");
            expect(normalizeVaryValue("Referer", "HTTPS://EXAMPLE.COM")).toBe(
                "HTTPS://EXAMPLE.COM",
            );
            expect(normalizeVaryValue("X-Custom-Header", "SomeValue")).toBe("SomeValue");
            expect(normalizeVaryValue("X-Locale", "fr-ÇA")).toBe("fr-ÇA");
        });

        it("handles empty string values", () => {
            expect(normalizeVaryValue(HttpHeader.ACCEPT, "")).toBe("");
            expect(normalizeVaryValue("user-agent", "")).toBe("");
        });
    });

    describe("base64 url encode function", () => {
        it("encodes ASCII strings correctly", () => {
            expect(base64UrlEncode("hello")).toBe("aGVsbG8");
            expect(base64UrlEncode("test123")).toBe("dGVzdDEyMw");
        });

        it("encodes strings with non-ASCII characters", () => {
            expect(base64UrlEncode("🌍")).toBe("8J-MjQ");
            expect(base64UrlEncode("こんにちは")).toBe("44GT44KT44Gr44Gh44Gv");
        });

        it("replaces + and / with - and _", () => {
            const input = String.fromCharCode(251, 255, 254);
            const encoded = base64UrlEncode(input);
            expect(encoded).not.toContain("+");
            expect(encoded).not.toContain("/");
            expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
        });

        it("removes trailing padding = characters", () => {
            const input = "any";
            expect(base64UrlEncode(input)).toBe("YW55");

            const input2 = "a";
            expect(base64UrlEncode(input2)).toBe("YQ");

            const input3 = "ab";
            expect(base64UrlEncode(input3)).toBe("YWI");
        });

        it("handles empty string", () => {
            expect(base64UrlEncode("")).toBe("");
        });
    });
});
