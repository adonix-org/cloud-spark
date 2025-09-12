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

import { assertMethods, isMethod, isMethodArray } from "@src/guards";
import { describe, expect, it } from "vitest";

describe("method guard unit tests", () => {
    describe("is method function", () => {
        it("is a method", () => {
            expect(isMethod("GET")).toBe(true);
            expect(isMethod("HEAD")).toBe(true);
            expect(isMethod("DELETE")).toBe(true);
            expect(isMethod("POST")).toBe(true);
            expect(isMethod("PUT")).toBe(true);
            expect(isMethod("PATCH")).toBe(true);
            expect(isMethod("OPTIONS")).toBe(true);
        });

        it("is not a method", () => {
            expect(isMethod(undefined as any)).toBe(false);
            expect(isMethod(null as any)).toBe(false);
            expect(isMethod(42 as any)).toBe(false);
            expect(isMethod({} as any)).toBe(false);
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

    describe("is method array function", () => {
        it("returns true for an array of valid methods", () => {
            expect(isMethodArray(["GET", "POST", "DELETE"])).toBe(true);
            expect(isMethodArray([])).toBe(true); // empty array is valid
        });

        it("returns false for an array containing invalid methods", () => {
            expect(isMethodArray(["GET", "FOO"])).toBe(false);
            expect(isMethodArray(["POST", 123])).toBe(false);
            expect(isMethodArray(["PUT", null])).toBe(false);
        });

        it("returns false for non-array values", () => {
            expect(isMethodArray("GET")).toBe(false);
            expect(isMethodArray(123)).toBe(false);
            expect(isMethodArray({})).toBe(false);
            expect(isMethodArray(undefined)).toBe(false);
            expect(isMethodArray(null)).toBe(false);
            expect(isMethodArray(true)).toBe(false);
        });

        it("works with mixed valid and invalid types", () => {
            expect(isMethodArray(["GET", "POST", "INVALID"])).toBe(false);
            expect(isMethodArray([true, "OPTIONS"])).toBe(false);
        });
    });

    describe("assert methods function", () => {
        it("does not throw for a valid method array", () => {
            expect(() => assertMethods(["GET", "POST"])).not.toThrow();
            expect(() => assertMethods([])).not.toThrow(); // empty array is valid
        });

        it("throws TypeError for an array with invalid methods", () => {
            expect(() => assertMethods(["GET", "FOO"])).toThrow(TypeError);
            expect(() => assertMethods(["POST", 123 as any])).toThrow(TypeError);
            expect(() => assertMethods(["DELETE", null as any])).toThrow(TypeError);
        });

        it("throws TypeError for non-array values", () => {
            expect(() => assertMethods("GET")).toThrow(TypeError);
            expect(() => assertMethods(123)).toThrow(TypeError);
            expect(() => assertMethods({})).toThrow(TypeError);
            expect(() => assertMethods(undefined)).toThrow(TypeError);
            expect(() => assertMethods(null)).toThrow(TypeError);
            expect(() => assertMethods(true)).toThrow(TypeError);
        });

        it("error message contains the invalid value", () => {
            try {
                assertMethods(["GET", "FOO"]);
            } catch (e: any) {
                expect(e.message).toContain("GET");
                expect(e.message).toContain("FOO");
            }
        });
    });
});
