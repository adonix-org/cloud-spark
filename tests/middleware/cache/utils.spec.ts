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

import { HttpHeader } from "@src/constants/http";
import { getVaryKey } from "@src/middleware/cache/utils";
import { describe, expect, it } from "vitest";

describe("cache utils unit tests ", () => {
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

export function decodeVaryKey(key: string): DecodedVary {
    const url = new URL(key);
    const base64Url = url.pathname.slice(1); // remove leading '/'

    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";

    const [urlStr, vary] = JSON.parse(Buffer.from(base64, "base64").toString("utf-8")) as [
        string,
        [string, string][],
    ];

    return {
        url: urlStr,
        vary,
        search: url.searchParams.toString(),
    };
}

export interface DecodedVary {
    url: string;
    vary: [string, string][];
    search: string;
}
