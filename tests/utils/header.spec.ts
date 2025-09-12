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

import { describe, it, beforeEach } from "vitest";
import { mergeHeader, setHeader } from "@src/utils/header";
import { expectHeadersEqual } from "@common";

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
});
