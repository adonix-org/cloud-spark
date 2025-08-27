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
import { getContentType, isMethod, MediaType, Method, Time } from "../src/common";

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

    it("leaves binary types alone", () => {
        expect(getContentType(MediaType.OCTET_STREAM)).toBe("application/octet-stream");
    });
});
