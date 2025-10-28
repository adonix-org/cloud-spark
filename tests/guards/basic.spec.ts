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

import { isBoolean, isNumber, isString, isStringArray } from "@src/guards/basic";
import { describe, expect, it } from "vitest";

describe("basic guard unit tests", () => {
    describe("is string array", () => {
        it("returns true for an array of strings", () => {
            expect(isStringArray(["a", "b", "c"])).toBe(true);
        });

        it("returns true for an empty array", () => {
            expect(isStringArray([])).toBe(true);
        });

        it("returns false for an array with non-string items", () => {
            expect(isStringArray(["a", 1, "c"])).toBe(false);
            expect(isStringArray([true, "b"])).toBe(false);
            expect(isStringArray([null])).toBe(false);
        });

        it("returns false for non-array values", () => {
            expect(isStringArray("abc")).toBe(false);
            expect(isStringArray(123)).toBe(false);
            expect(isStringArray({})).toBe(false);
            expect(isStringArray(undefined)).toBe(false);
            expect(isStringArray(null)).toBe(false);
        });
    });

    describe("is string", () => {
        it("returns true for strings", () => {
            expect(isString("hello")).toBe(true);
        });

        it("returns false for non-strings", () => {
            expect(isString(123)).toBe(false);
            expect(isString({})).toBe(false);
            expect(isString(undefined)).toBe(false);
            expect(isString(null)).toBe(false);
            expect(isString(() => {})).toBe(false);
        });
    });

    describe("is number", () => {
        it("returns true for valid numbers", () => {
            expect(isNumber(0)).toBe(true);
            expect(isNumber(42)).toBe(true);
            expect(isNumber(-5)).toBe(true);
            expect(isNumber(Infinity)).toBe(true);
            expect(isNumber(-Infinity)).toBe(true);
        });

        it("returns false for NaN", () => {
            expect(isNumber(NaN)).toBe(false);
        });

        it("returns false for non-number types", () => {
            expect(isNumber("123")).toBe(false);
            expect(isNumber(true)).toBe(false);
            expect(isNumber(null)).toBe(false);
            expect(isNumber(undefined)).toBe(false);
            expect(isNumber({})).toBe(false);
            expect(isNumber([])).toBe(false);
        });
    });

    describe("is boolean", () => {
        it("returns true for true and false", () => {
            expect(isBoolean(true)).toBe(true);
            expect(isBoolean(false)).toBe(true);
        });

        it("returns false for non-boolean values", () => {
            expect(isBoolean(0)).toBe(false);
            expect(isBoolean(1)).toBe(false);
            expect(isBoolean("true")).toBe(false);
            expect(isBoolean(null)).toBe(false);
            expect(isBoolean(undefined)).toBe(false);
            expect(isBoolean({})).toBe(false);
            expect(isBoolean([])).toBe(false);
        });
    });
});
