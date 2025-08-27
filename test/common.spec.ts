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
import { env, ctx } from "./mock";
import { GET_REQUEST, TestCorsWorker } from "./constants";
import { getContentType, isMethod, MediaType, Method, setHeader, Time } from "../src/common";

describe("is method function", () => {
    it("is method", () => {
        expect(isMethod("GET")).toBe(true);
        expect(isMethod("HEAD")).toBe(true);
        expect(isMethod("OPTIONS")).toBe(true);
        expect(isMethod("DELETE")).toBe(true);
        expect(isMethod("POST")).toBe(true);
        expect(isMethod("PUT")).toBe(true);
        expect(isMethod("PATCH")).toBe(true);
    });

    it("is not method", () => {
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
    it("adds charset to json", () => {
        expect(getContentType(MediaType.JSON)).toBe("application/json; charset=utf-8");
    });

    it("adds charset to plain text", () => {
        expect(getContentType(MediaType.PLAIN_TEXT)).toBe("text/plain; charset=utf-8");
    });

    it("adds charset to html", () => {
        expect(getContentType(MediaType.HTML)).toBe("text/html; charset=utf-8");
    });

    it("no charset for binary type", () => {
        expect(getContentType(MediaType.OCTET_STREAM)).toBe("application/octet-stream");
    });
});

describe("set new headers", () => {
    let headers: Headers;

    beforeEach(() => {
        headers = new Headers();
    });

    it("add string", () => {
        setHeader(headers, "test-key", "1");
        expect([...headers.entries()]).toStrictEqual([["test-key", "1"]]);
    });

    it("add empty string", () => {
        setHeader(headers, "test-key", "");
        expect([...headers.entries()]).toStrictEqual([]);
    });

    it("add array", () => {
        setHeader(headers, "test-key", ["1", "2", "3"]);
        expect([...headers.entries()]).toStrictEqual([["test-key", "1, 2, 3"]]);
    });

    it("add empty array", () => {
        setHeader(headers, "test-key", []);
        expect([...headers.entries()]).toStrictEqual([]);
    });

    it("add array with duplicates", () => {
        setHeader(headers, "test-key", ["3", "2", "1", "4", "1", "2", "3"]);
        expect([...headers.entries()]).toStrictEqual([["test-key", "1, 2, 3, 4"]]);
    });

    it("add array including white space", () => {
        setHeader(headers, "test-key", ["   ", "3", "2", "1", "4", "3", " "]);
        expect([...headers.entries()]).toStrictEqual([["test-key", "1, 2, 3, 4"]]);
    });

    it("add array only white space", () => {
        setHeader(headers, "test-key", [" ", "  ", "   "]);
        expect([...headers.entries()]).toStrictEqual([]);
    });
});

describe("set exising headers", () => {
    let headers: Headers;

    beforeEach(() => {
        headers = new Headers([
            ["test-key", "1"],
            ["safe-key", "2"],
        ]);
    });

    it("add string", () => {
        setHeader(headers, "test-key", "2");
        expect([...headers.entries()]).toStrictEqual([
            ["safe-key", "2"],
            ["test-key", "2"],
        ]);
    });

    it("add empty string", () => {
        setHeader(headers, "test-key", "");
        expect([...headers.entries()]).toStrictEqual([["safe-key", "2"]]);
    });

    it("add empty array", () => {
        setHeader(headers, "test-key", []);
        expect([...headers.entries()]).toStrictEqual([["safe-key", "2"]]);
    });

    it("add array existing header (no-merge)", () => {
        setHeader(headers, "test-key", ["2", "3"]);
        expect([...headers.entries()]).toStrictEqual([
            ["safe-key", "2"],
            ["test-key", "2, 3"],
        ]);
    });

    it("add array existing header duplicates (no-merge)", () => {
        setHeader(headers, "test-key", ["4", "3", "3", "2", "1"]);
        expect([...headers.entries()]).toStrictEqual([
            ["safe-key", "2"],
            ["test-key", "1, 2, 3, 4"],
        ]);
    });
});
