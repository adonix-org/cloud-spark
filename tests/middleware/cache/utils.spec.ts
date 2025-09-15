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

import { decodeVaryKey } from "@common";
import { HttpHeader } from "@src/constants/http";
import {
    getVaryFiltered,
    getVaryHeader,
    getVaryKey,
    isCacheable,
} from "@src/middleware/cache/utils";
import { describe, expect, it } from "vitest";

describe("cache utils unit tests ", () => {
    describe("is cacheable function", () => {
        it("returns false if response.ok is false", () => {
            const response = new Response(null, { status: 500 });
            expect(isCacheable(response)).toBe(false);
        });

        it("returns false if vary header is '*'", () => {
            const response = new Response(null, {
                status: 200,
                headers: { Vary: "*" },
            });
            expect(isCacheable(response)).toBe(false);
        });

        it("returns false if vary header contains '*'", () => {
            const response = new Response(null, {
                status: 200,
                headers: { Vary: "Accept, *, Accept-Encoding" },
            });
            expect(isCacheable(response)).toBe(false);
        });

        it("returns true if response.ok is true and vary header does not contain '*'", () => {
            const response = new Response(null, {
                status: 200,
                headers: { Vary: "Accept-Encoding, Content-Type" },
            });
            expect(isCacheable(response)).toBe(true);
        });

        it("returns true if response.ok is true and vary header is missing", () => {
            const response = new Response(null, { status: 200 });
            expect(isCacheable(response)).toBe(true);
        });

        it("returns true if response.ok is true and vary header is empty", () => {
            const response = new Response(null, {
                status: 200,
                headers: { Vary: "" },
            });
            expect(isCacheable(response)).toBe(true);
        });
    });

    describe("get vary header function", () => {
        it("returns single value lowercased", () => {
            const headers = new Headers({ Vary: "Origin" });
            const response = new Response(null, { headers });

            expect(getVaryHeader(response)).toEqual(["origin"]);
        });

        it("splits multiple comma-separated values and sorts them", () => {
            const headers = new Headers({ Vary: "Origin, Accept-Encoding, " });
            const response = new Response(null, { headers });

            expect(getVaryHeader(response)).toEqual(["accept-encoding", "origin"]);
        });

        it("deduplicates repeated values", () => {
            const headers = new Headers({
                Vary: "Origin, origin, ACCEPT-ENCODING, accept-encoding",
            });
            const response = new Response(null, { headers });

            expect(getVaryHeader(response)).toEqual(["accept-encoding", "origin"]);
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

    describe("get vary filtered function", () => {
        it("removes 'accept-encoding' when it is the only header", () => {
            const input = ["Accept-Encoding"];
            expect(getVaryFiltered(input)).toEqual([]);
        });

        it("removes 'accept-encoding' among other headers", () => {
            const input = ["Origin", "Accept-Encoding", "Content-Type"];
            expect(getVaryFiltered(input)).toEqual(["origin", "content-type"]);
        });

        it("removes 'accept-encoding' case-insensitively", () => {
            const input = ["origin", "ACCEPT-ENCODING", "content-type"];
            expect(getVaryFiltered(input)).toEqual(["origin", "content-type"]);
        });

        it("returns lowercased headers if none are 'accept-encoding'", () => {
            const input = ["Origin", "Content-Type"];
            expect(getVaryFiltered(input)).toEqual(["origin", "content-type"]);
        });

        it("returns empty array if input is empty", () => {
            expect(getVaryFiltered([])).toEqual([]);
        });

        it("works if input has duplicates of 'accept-encoding'", () => {
            const input = ["Accept-Encoding", "ACCEPT-ENCODING"];
            expect(getVaryFiltered(input)).toEqual([]);
        });
    });

    describe("get vary key function", () => {
        it("produces different keys for different header values", () => {
            const url = "https://example.com/foo";
            const requestA = new Request(url, { headers: { Accept: "text/html" } });
            const requestB = new Request(url, { headers: { Accept: "application/json" } });

            const vary = ["Accept"];
            const keyA = getVaryKey(requestA, vary);
            const keyB = getVaryKey(requestB, vary);

            const decodedA = decodeVaryKey(keyA);
            const decodedB = decodeVaryKey(keyB);

            expect(decodedA.vary).not.toEqual(decodedB.vary);
        });

        it("ignores Accept-Encoding in vary headers", () => {
            const url = "https://example.com/foo";
            const request = new Request(url, {
                headers: { "Accept-Encoding": "gzip", Accept: "text/html" },
            });
            const vary = ["Accept", HttpHeader.ACCEPT_ENCODING];

            const key = getVaryKey(request, vary);
            const decoded = decodeVaryKey(key);

            const headersInKey = decoded.vary.map(([header]) => header);
            expect(headersInKey).toContain("accept");
            expect(headersInKey).not.toContain("accept-encoding");
        });

        it("produces same key regardless of vary header order", () => {
            const url = "https://example.com/foo";
            const request = new Request(url, { headers: { "X-Foo": "1", "X-Bar": "2" } });

            const vary1 = ["X-Foo", "X-Bar"];
            const vary2 = ["X-Bar", "X-Foo"];

            const key1 = getVaryKey(request, vary1);
            const key2 = getVaryKey(request, vary2);

            expect(key1).toBe(key2);

            const decoded1 = decodeVaryKey(key1);
            const decoded2 = decodeVaryKey(key2);

            expect(decoded1.vary).toEqual(decoded2.vary);
        });

        it("produces same key for empty vary headers", () => {
            const url = "https://example.com/foo";
            const request = new Request(url);

            const key1 = getVaryKey(request, []);
            const key2 = getVaryKey(request, []);

            expect(key1).toBe(key2);

            const decoded1 = decodeVaryKey(key1);
            const decoded2 = decodeVaryKey(key2);

            expect(decoded1.vary).toEqual([]);
            expect(decoded1.url).toBe(decoded2.url);
            expect(decoded1.search).toBe(decoded2.search);
        });

        it("produces same key regardless of query parameter order", () => {
            const url1 = "https://example.com/foo?a=1&b=2&c=3";
            const url2 = "https://example.com/foo?b=2&c=3&a=1";

            const request1 = new Request(url1, { headers: { Accept: "text/html" } });
            const request2 = new Request(url2, { headers: { Accept: "text/html" } });

            const vary = ["Accept"];

            const key1 = getVaryKey(request1, vary);
            const key2 = getVaryKey(request2, vary);

            expect(key1).toBe(key2);

            const decoded1 = decodeVaryKey(key1);
            const decoded2 = decodeVaryKey(key2);

            expect(decoded1.url).toBe(decoded2.url);
            expect(decoded1.search).toBe(decoded2.search);
            expect(decoded1.vary).toEqual(decoded2.vary);
        });

        it("handles repeated query parameters", () => {
            const url1 = "https://example.com/foo?a=1&a=2&b=3";
            const url2 = "https://example.com/foo?b=3&a=1&a=2";

            const request1 = new Request(url1, { headers: { Accept: "text/html" } });
            const request2 = new Request(url2, { headers: { Accept: "text/html" } });

            const vary = ["Accept"];

            const key1 = getVaryKey(request1, vary);
            const key2 = getVaryKey(request2, vary);

            expect(key1).toBe(key2);
        });

        it("handles non-ASCII characters in URL and headers", () => {
            const url = "https://example.com/foö?x=ü";
            const request = new Request(url, { headers: { "X-Custom": "ñ" } });
            const vary = ["X-Custom"];

            const key = getVaryKey(request, vary);
            const decoded = decodeVaryKey(key);

            expect(decoded.url).toBe("https://example.com/fo%C3%B6");
            expect(decoded.vary).toEqual([["x-custom", "ñ"]]);
            expect(decoded.search).toBe("x=%C3%BC");
        });

        it("works with empty query string", () => {
            const url = "https://example.com/foo";
            const request = new Request(url, { headers: { Accept: "text/html" } });
            const vary = ["Accept"];

            const key = getVaryKey(request, vary);
            const decoded = decodeVaryKey(key);

            expect(decoded.search).toBe("");
        });
    });
});

