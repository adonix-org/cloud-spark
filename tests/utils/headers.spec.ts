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

import { expectHeadersEqual } from "@common";
import {
    filterHeaders,
    getHeaderKeys,
    getHeaderValues,
    mergeHeader,
    setHeader,
} from "@src/utils/headers";
import { beforeEach, describe, expect, it } from "vitest";

describe("header functions unit tests", () => {
    let headers: Headers;

    describe("set header function on empty headers", () => {
        beforeEach(() => {
            headers = new Headers();
        });

        it("adds a string to headers", () => {
            setHeader(headers, "test-key", "1");
            expectHeadersEqual(headers, [["test-key", "1"]]);
        });

        it("does not add an empty string", () => {
            setHeader(headers, "test-key", "");
            expectHeadersEqual(headers, []);
        });

        it("adds an array to headers", () => {
            setHeader(headers, "test-key", ["1", "2", "3"]);
            expectHeadersEqual(headers, [["test-key", "1, 2, 3"]]);
        });

        it("does not add an empty array", () => {
            setHeader(headers, "test-key", []);
            expectHeadersEqual(headers, []);
        });

        it("adds an array and removes duplicates", () => {
            setHeader(headers, "test-key", ["3", "2", "1", "4", "1", "2", "3"]);
            expectHeadersEqual(headers, [["test-key", "1, 2, 3, 4"]]);
        });

        it("adds an array and removes any white space elements", () => {
            setHeader(headers, "test-key", ["   ", "3", "2", "1", "4", "3", " "]);
            expectHeadersEqual(headers, [["test-key", "1, 2, 3, 4"]]);
        });

        it("does not add an array containing only white space elements", () => {
            setHeader(headers, "test-key", [" ", "  ", "   "]);
            expectHeadersEqual(headers, []);
        });
    });

    describe("set header function on existing headers", () => {
        beforeEach(() => {
            headers = new Headers([
                ["test-key", "1"],
                ["safe-key", "2"],
            ]);
        });

        it("adds a string to headers", () => {
            setHeader(headers, "test-key", "2");
            expectHeadersEqual(headers, [
                ["safe-key", "2"],
                ["test-key", "2"],
            ]);
        });

        it("does not add an empty string", () => {
            setHeader(headers, "new-key", "");
            expectHeadersEqual(headers, [
                ["safe-key", "2"],
                ["test-key", "1"],
            ]);
        });

        it("does not add an empty array", () => {
            setHeader(headers, "new-key", []);
            expectHeadersEqual(headers, [
                ["safe-key", "2"],
                ["test-key", "1"],
            ]);
        });

        it("deletes the header if new value is empty", () => {
            setHeader(headers, "test-key", "");
            expectHeadersEqual(headers, [["safe-key", "2"]]);
        });

        it("deletes the header if new array is empty", () => {
            setHeader(headers, "test-key", []);
            expectHeadersEqual(headers, [["safe-key", "2"]]);
        });

        it("adds an array to existing headers (no-merge)", () => {
            setHeader(headers, "test-key", ["2", "3"]);
            expectHeadersEqual(headers, [
                ["safe-key", "2"],
                ["test-key", "2, 3"],
            ]);
        });

        it("adds an array to existing headers and removes duplicates (no-merge)", () => {
            setHeader(headers, "test-key", ["4", "3", "3", "2", "1"]);
            expectHeadersEqual(headers, [
                ["safe-key", "2"],
                ["test-key", "1, 2, 3, 4"],
            ]);
        });
    });

    describe("merge header function on empty headers", () => {
        beforeEach(() => {
            headers = new Headers();
        });

        it("adds a string to headers", () => {
            mergeHeader(headers, "test-key", "1");
            expectHeadersEqual(headers, [["test-key", "1"]]);
        });

        it("does not add an empty string", () => {
            mergeHeader(headers, "test-key", "");
            expectHeadersEqual(headers, []);
        });

        it("adds an array to headers", () => {
            mergeHeader(headers, "test-key", ["1", "2", "3"]);
            expectHeadersEqual(headers, [["test-key", "1, 2, 3"]]);
        });

        it("does not add an empty array", () => {
            mergeHeader(headers, "test-key", []);
            expectHeadersEqual(headers, []);
        });

        it("adds an array and removes any duplicates", () => {
            mergeHeader(headers, "test-key", ["3", "2", "1", "4", "1", "2", "3"]);
            expectHeadersEqual(headers, [["test-key", "1, 2, 3, 4"]]);
        });

        it("adds an array and removes any white space elements", () => {
            mergeHeader(headers, "test-key", ["   ", "3", "2", "1", "4", "3", " "]);
            expectHeadersEqual(headers, [["test-key", "1, 2, 3, 4"]]);
        });

        it("does not add an array containing only white space elements", () => {
            mergeHeader(headers, "test-key", [" ", "  ", "   "]);
            expectHeadersEqual(headers, []);
        });
    });

    describe("merge header function on existing headers", () => {
        beforeEach(() => {
            headers = new Headers([
                ["test-key", "1"],
                ["safe-key", "2"],
            ]);
        });

        it("merges a string to existing header", () => {
            mergeHeader(headers, "test-key", "2");
            expectHeadersEqual(headers, [
                ["safe-key", "2"],
                ["test-key", "1, 2"],
            ]);
        });

        it("does not merge an empty string", () => {
            mergeHeader(headers, "test-key", "");
            expectHeadersEqual(headers, [
                ["safe-key", "2"],
                ["test-key", "1"],
            ]);
        });

        it("does not merge an empty array", () => {
            mergeHeader(headers, "test-key", []);
            expectHeadersEqual(headers, [
                ["safe-key", "2"],
                ["test-key", "1"],
            ]);
        });

        it("merges an array to an existing header", () => {
            mergeHeader(headers, "test-key", ["4", "3", "2"]);
            expectHeadersEqual(headers, [
                ["safe-key", "2"],
                ["test-key", "1, 2, 3, 4"],
            ]);
        });

        it("merges an array to an existing header and removes duplicates", () => {
            mergeHeader(headers, "test-key", ["4", "3", "3", "2", "1"]);
            expectHeadersEqual(headers, [
                ["safe-key", "2"],
                ["test-key", "1, 2, 3, 4"],
            ]);
        });

        it("creates a new header from a string if one does not exist", () => {
            mergeHeader(headers, "new-key", "3");
            expectHeadersEqual(headers, [
                ["new-key", "3"],
                ["safe-key", "2"],
                ["test-key", "1"],
            ]);
        });

        it("creates a new header from an array if one does not exist", () => {
            mergeHeader(headers, "new-key", ["1", "2", "3"]);
            expectHeadersEqual(headers, [
                ["new-key", "1, 2, 3"],
                ["safe-key", "2"],
                ["test-key", "1"],
            ]);
        });

        it("creates a new header from an array and removes duplicates and white space", () => {
            mergeHeader(headers, "new-key", ["2", "3", "1", "2", "3", " 1 ", " "]);
            expectHeadersEqual(headers, [
                ["new-key", "1, 2, 3"],
                ["safe-key", "2"],
                ["test-key", "1"],
            ]);
        });
    });

    describe("get header values function", () => {
        it("returns empty array if the header is missing", () => {
            const headers = new Headers();
            expect(getHeaderValues(headers, "x-missing")).toEqual([]);
        });

        it("splits comma-separated values and trims whitespace", () => {
            const headers = new Headers({
                "x-test": " a , b ,c ",
            });
            expect(getHeaderValues(headers, "x-test")).toEqual(["a", "b", "c"]);
        });

        it("removes empty tokens", () => {
            const headers = new Headers({
                "x-test": "a,, ,b",
            });
            expect(getHeaderValues(headers, "x-test")).toEqual(["a", "b"]);
        });

        it("deduplicates values while preserving case", () => {
            const headers = new Headers({
                "x-test": "a,B,a,b",
            });
            expect(getHeaderValues(headers, "x-test")).toEqual(["B", "a", "b"]);
            // sorted lexically: ["B", "a", "b"]
        });

        it("sorts values lexicographically", () => {
            const headers = new Headers({
                "x-test": "c,b,a",
            });
            expect(getHeaderValues(headers, "x-test")).toEqual(["a", "b", "c"]);
        });

        it("handles single-value headers correctly", () => {
            const headers = new Headers({
                "x-test": "single",
            });
            expect(getHeaderValues(headers, "x-test")).toEqual(["single"]);
        });

        it("handles values with only whitespace", () => {
            const headers = new Headers({
                "x-test": "   ",
            });
            expect(getHeaderValues(headers, "x-test")).toEqual([]);
        });

        it("handles complex mixed cases", () => {
            const headers = new Headers({
                "x-test": "  b , a ,B,, c , , A ",
            });
            expect(getHeaderValues(headers, "x-test")).toEqual(["A", "B", "a", "b", "c"]);
        });
    });

    describe("filter headers function", () => {
        it("removes a single header", () => {
            const headers = new Headers({
                "content-type": "application/json",
                "x-test": "123",
            });
            filterHeaders(headers, ["content-type"]);
            expectHeadersEqual(headers, [["x-test", "123"]]);
        });

        it("removes multiple headers", () => {
            const headers = new Headers({
                "content-type": "application/json",
                "content-length": "42",
                "x-custom": "ok",
            });
            filterHeaders(headers, ["content-type", "content-length"]);
            expectHeadersEqual(headers, [["x-custom", "ok"]]);
        });

        it("ignores headers that are not present", () => {
            const headers = new Headers({
                "x-existing": "yes",
            });
            filterHeaders(headers, ["x-missing", "another-missing"]);
            expectHeadersEqual(headers, [["x-existing", "yes"]]);
        });

        it("is case-insensitive (per spec)", () => {
            const headers = new Headers({
                "Content-Type": "text/html",
                "X-Case": "match",
            });
            filterHeaders(headers, ["content-type", "x-case"]);
            expectHeadersEqual(headers, []);
        });

        it("no-op when keys is empty", () => {
            const headers = new Headers({
                "x-keep": "ok",
            });
            filterHeaders(headers, []);
            expectHeadersEqual(headers, [["x-keep", "ok"]]);
        });
    });

    describe("get header keys function", () => {
        it("returns an empty array when Headers is empty", () => {
            const headers = new Headers();
            const keys = getHeaderKeys(headers);
            expect(keys).toEqual([]);
        });

        it("returns a sorted array of header names", () => {
            const headers = new Headers({
                "X-Zebra": "1",
                "content-type": "application/json",
                accept: "text/html",
            });

            const keys = getHeaderKeys(headers);
            expect(keys).toEqual(["accept", "content-type", "x-zebra"]);
        });

        it("handles header names already in lower-case", () => {
            const headers = new Headers({
                accept: "text/html",
                "content-type": "application/json",
            });

            const keys = getHeaderKeys(headers);
            expect(keys).toEqual(["accept", "content-type"]);
        });

        it("returns a stable sort for multiple headers with similar prefixes", () => {
            const headers = new Headers({
                "x-test": "1",
                "x-abc": "2",
                "x-xyz": "3",
            });

            const keys = getHeaderKeys(headers);
            expect(keys).toEqual(["x-abc", "x-test", "x-xyz"]);
        });

        it("ignores values and only returns header names", () => {
            const headers = new Headers({
                "x-one": "1",
                "x-two": "2",
            });

            const keys = getHeaderKeys(headers);
            expect(keys).toEqual(["x-one", "x-two"]);
        });
    });
});
