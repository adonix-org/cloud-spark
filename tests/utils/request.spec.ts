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

import { GET_REQUEST, GET_REQUEST_WITH_ORIGIN, VALID_ORIGIN, VALID_URL } from "@common";
import { MediaType } from "@src/constants/media-types";
import { getContentType, getOrigin, isMethod } from "@src/utils/request";
import { describe, it, expect } from "vitest";

describe("request functions unit tests", () => {
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
