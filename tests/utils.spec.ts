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

import { describe, it, expect, beforeEach } from "vitest";
import { GET_REQUEST, GET_REQUEST_WITH_ORIGIN, VALID_ORIGIN, VALID_URL } from "@constants";
import { getContentType, getOrigin, isMethod } from "@src/utils/request";
import { MediaType } from "@src/constants/media-types";
import { mergeHeader, setHeader } from "@src/utils/header";
import { normalizeUrl } from "@src/utils/url";

describe("common functions unit tests", () => {
    describe("is method function", () => {
        it("is a method", () => {
            expect(isMethod("GET")).toBe(true);
            expect(isMethod("HEAD")).toBe(true);
            expect(isMethod("DELETE")).toBe(true);
            expect(isMethod("POST")).toBe(true);
            expect(isMethod("PUT")).toBe(true);
            expect(isMethod("PATCH")).toBe(true);
        });

        it("is not a method", () => {
            expect(isMethod("")).toBe(false);
            expect(isMethod(" ")).toBe(false);
            expect(isMethod("METHOD")).toBe(false);
            expect(isMethod("\nGET")).toBe(false);
            expect(isMethod("GET\n")).toBe(false);
            expect(isMethod("get")).toBe(false);
            expect(isMethod("Get")).toBe(false);
            expect(isMethod(" GET")).toBe(false);
        });
    });

    describe("get content type function", () => {
        it("adds the charset to json", () => {
            expect(getContentType(MediaType.JSON)).toBe("application/json; charset=utf-8");
        });

        it("adds the charset to plain text", () => {
            expect(getContentType(MediaType.PLAIN_TEXT)).toBe("text/plain; charset=utf-8");
        });

        it("adds the charset to html", () => {
            expect(getContentType(MediaType.HTML)).toBe("text/html; charset=utf-8");
        });

        it("does not add charset for binary type", () => {
            expect(getContentType(MediaType.OCTET_STREAM)).toBe("application/octet-stream");
        });
    });

    describe("set header function on empty headers", () => {
        let headers: Headers;

        beforeEach(() => {
            headers = new Headers();
        });

        it("adds a string to headers", () => {
            setHeader(headers, "test-key", "1");
            expect([...headers.entries()]).toStrictEqual([["test-key", "1"]]);
        });

        it("does not add an empty string", () => {
            setHeader(headers, "test-key", "");
            expect([...headers.entries()]).toStrictEqual([]);
        });

        it("adds an array to headers", () => {
            setHeader(headers, "test-key", ["1", "2", "3"]);
            expect([...headers.entries()]).toStrictEqual([["test-key", "1, 2, 3"]]);
        });

        it("does not add an empty array", () => {
            setHeader(headers, "test-key", []);
            expect([...headers.entries()]).toStrictEqual([]);
        });

        it("adds an array and removes duplicates", () => {
            setHeader(headers, "test-key", ["3", "2", "1", "4", "1", "2", "3"]);
            expect([...headers.entries()]).toStrictEqual([["test-key", "1, 2, 3, 4"]]);
        });

        it("adds an array and removes any white space elements", () => {
            setHeader(headers, "test-key", ["   ", "3", "2", "1", "4", "3", " "]);
            expect([...headers.entries()]).toStrictEqual([["test-key", "1, 2, 3, 4"]]);
        });

        it("does not add an array containing only white space elements", () => {
            setHeader(headers, "test-key", [" ", "  ", "   "]);
            expect([...headers.entries()]).toStrictEqual([]);
        });
    });

    describe("set header function on existing headers", () => {
        let headers: Headers;

        beforeEach(() => {
            headers = new Headers([
                ["test-key", "1"],
                ["safe-key", "2"],
            ]);
        });

        it("adds a string to headers", () => {
            setHeader(headers, "test-key", "2");
            expect([...headers.entries()]).toStrictEqual([
                ["safe-key", "2"],
                ["test-key", "2"],
            ]);
        });

        it("does not add an empty string", () => {
            setHeader(headers, "test-key", "");
            expect([...headers.entries()]).toStrictEqual([["safe-key", "2"]]);
        });

        it("does not add an empty array", () => {
            setHeader(headers, "test-key", []);
            expect([...headers.entries()]).toStrictEqual([["safe-key", "2"]]);
        });

        it("adds an array to existing headers (no-merge)", () => {
            setHeader(headers, "test-key", ["2", "3"]);
            expect([...headers.entries()]).toStrictEqual([
                ["safe-key", "2"],
                ["test-key", "2, 3"],
            ]);
        });

        it("adds an array to existing headers and removes duplicates (no-merge)", () => {
            setHeader(headers, "test-key", ["4", "3", "3", "2", "1"]);
            expect([...headers.entries()]).toStrictEqual([
                ["safe-key", "2"],
                ["test-key", "1, 2, 3, 4"],
            ]);
        });
    });

    describe("merge header function on empty headers", () => {
        let headers: Headers;

        beforeEach(() => {
            headers = new Headers();
        });

        it("adds a string to headers", () => {
            mergeHeader(headers, "test-key", "1");
            expect([...headers.entries()]).toStrictEqual([["test-key", "1"]]);
        });

        it("does not add an empty string", () => {
            mergeHeader(headers, "test-key", "");
            expect([...headers.entries()]).toStrictEqual([]);
        });

        it("adds an array to headers", () => {
            mergeHeader(headers, "test-key", ["1", "2", "3"]);
            expect([...headers.entries()]).toStrictEqual([["test-key", "1, 2, 3"]]);
        });

        it("does not add an empty array", () => {
            mergeHeader(headers, "test-key", []);
            expect([...headers.entries()]).toStrictEqual([]);
        });

        it("adds an array and removes any duplicates", () => {
            mergeHeader(headers, "test-key", ["3", "2", "1", "4", "1", "2", "3"]);
            expect([...headers.entries()]).toStrictEqual([["test-key", "1, 2, 3, 4"]]);
        });

        it("adds an array and removes any white space elements", () => {
            mergeHeader(headers, "test-key", ["   ", "3", "2", "1", "4", "3", " "]);
            expect([...headers.entries()]).toStrictEqual([["test-key", "1, 2, 3, 4"]]);
        });

        it("does not add an array containing only white space elements", () => {
            mergeHeader(headers, "test-key", [" ", "  ", "   "]);
            expect([...headers.entries()]).toStrictEqual([]);
        });
    });

    describe("merge header function on existing headers", () => {
        let headers: Headers;

        beforeEach(() => {
            headers = new Headers([
                ["test-key", "1"],
                ["safe-key", "2"],
            ]);
        });

        it("merges a string to existing header", () => {
            mergeHeader(headers, "test-key", "2");
            expect([...headers.entries()]).toStrictEqual([
                ["safe-key", "2"],
                ["test-key", "1, 2"],
            ]);
        });

        it("does not merge an empty string", () => {
            mergeHeader(headers, "test-key", "");
            expect([...headers.entries()]).toStrictEqual([
                ["safe-key", "2"],
                ["test-key", "1"],
            ]);
        });

        it("does not merge an empty array", () => {
            mergeHeader(headers, "test-key", []);
            expect([...headers.entries()]).toStrictEqual([
                ["safe-key", "2"],
                ["test-key", "1"],
            ]);
        });

        it("merges an array to an existing header", () => {
            mergeHeader(headers, "test-key", ["4", "3", "2"]);
            expect([...headers.entries()]).toStrictEqual([
                ["safe-key", "2"],
                ["test-key", "1, 2, 3, 4"],
            ]);
        });

        it("merges an array to an existing header and removes duplicates", () => {
            mergeHeader(headers, "test-key", ["4", "3", "3", "2", "1"]);
            expect([...headers.entries()]).toStrictEqual([
                ["safe-key", "2"],
                ["test-key", "1, 2, 3, 4"],
            ]);
        });

        it("creates a new header from a string if one does not exist", () => {
            mergeHeader(headers, "new-key", "3");
            expect([...headers.entries()]).toStrictEqual([
                ["new-key", "3"],
                ["safe-key", "2"],
                ["test-key", "1"],
            ]);
        });

        it("creates a new header from an array if one does not exist", () => {
            mergeHeader(headers, "new-key", ["1", "2", "3"]);
            expect([...headers.entries()]).toStrictEqual([
                ["new-key", "1, 2, 3"],
                ["safe-key", "2"],
                ["test-key", "1"],
            ]);
        });

        it("creates a new header from an array and removes duplicates and white space", () => {
            mergeHeader(headers, "new-key", ["2", "3", "1", "2", "3", " 1 ", " "]);
            expect([...headers.entries()]).toStrictEqual([
                ["new-key", "1, 2, 3"],
                ["safe-key", "2"],
                ["test-key", "1"],
            ]);
        });
    });

    describe("normalize url function", () => {
        const BASE = "https://localhost/";

        it("does not modify a url with no search parameters", () => {
            expect(normalizeUrl(BASE).toString()).toBe(BASE);
        });

        it("retains the single search parameter in a url", () => {
            const url = `${BASE}?a=1`;
            expect(normalizeUrl(url).toString()).toBe(url);
        });

        it("does not modify pre-sorted search parameters", () => {
            const url = `${BASE}?a=1&b=2&c=3`;
            expect(normalizeUrl(url).toString()).toBe(url);
        });

        it("sorts the url search parameters", () => {
            const url = `${BASE}?&b=2&c=3&a=1`;
            expect(normalizeUrl(url).toString()).toBe(`${BASE}?a=1&b=2&c=3`);
        });

        it("sorts and retains search parameters containing duplicate keys", () => {
            const url = `${BASE}?&b=2&a=4&c=3&a=1`;

            // normalizeUrl sorts keys alphabetically, but preserves the order of duplicate keys.
            // So here we expect both 'a' parameters in the original order (4 then 1) to be retained,
            // even though 'a' comes before 'b' and 'c' after sorting.
            expect(normalizeUrl(url).toString()).toBe(`${BASE}?a=4&a=1&b=2&c=3`);
        });
    });

    describe("get origin function", () => {
        it("returns null for no origin header in the request", () => {
            expect(getOrigin(GET_REQUEST)).toBe(null);
        });

        it("returns the origin from the origin header in the request", () => {
            expect(getOrigin(GET_REQUEST_WITH_ORIGIN)).toBe(VALID_ORIGIN);
        });

        it("returns null for 'null' string origin", () => {
            const request = new Request(VALID_URL, {
                headers: {
                    Origin: "null",
                },
            });
            expect(getOrigin(request)).toBe(null);
        });

        it("returns null for invalid origin", () => {
            const request = new Request(VALID_URL, {
                headers: {
                    Origin: "not a valid origin",
                },
            });
            expect(getOrigin(request)).toBe(null);
        });

        it("returns the normalized origin", () => {
            const request = new Request(VALID_URL, {
                headers: {
                    Origin: "https://localhost/path",
                },
            });
            expect(getOrigin(request)).toBe("https://localhost");
        });

        it("returns the normalized origin with port", () => {
            const request = new Request(VALID_URL, {
                headers: {
                    Origin: "https://localhot:3000/",
                },
            });
            expect(getOrigin(request)).toBe("https://localhot:3000");
        });
    });
});
