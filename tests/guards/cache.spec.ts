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

import { describe, it, expect } from "vitest";
import { assertCacheName, assertGetKey, assertKey } from "@src/guards/cache";

describe("cache guard unit tests", () => {
    describe("assert cache name", () => {
        it("does not throw for undefined", () => {
            expect(() => assertCacheName(undefined)).not.toThrow();
        });

        it("does not throw for valid strings", () => {
            expect(() => assertCacheName("myCache")).not.toThrow();
        });

        it("throws TypeError for non-strings", () => {
            const fn = () => {};
            expect(() => assertCacheName(123)).toThrow(TypeError);
            expect(() => assertCacheName({})).toThrow(TypeError);
            expect(() => assertCacheName(fn)).toThrow(TypeError);
            expect(() => assertCacheName(null)).toThrow(TypeError);
        });
    });

    describe("assert get key", () => {
        it("does not throw for undefined", () => {
            expect(() => assertGetKey(undefined)).not.toThrow();
        });

        it("does not throw for valid functions", () => {
            const fn1 = () => {};
            function fn2() {
                return;
            }
            expect(() => assertGetKey(fn1)).not.toThrow();
            expect(() => assertGetKey(fn2)).not.toThrow();
        });

        it("throws TypeError for non-functions", () => {
            expect(() => assertGetKey(123)).toThrow(TypeError);
            expect(() => assertGetKey("hello")).toThrow(TypeError);
            expect(() => assertGetKey({})).toThrow(TypeError);
            expect(() => assertGetKey(null)).toThrow(TypeError);
        });
    });

    describe("assertURL", () => {
        it("does not throw for a valid URL", () => {
            const url = new URL("https://example.com");
            expect(() => assertKey(url)).not.toThrow();
        });

        it("throws TypeError for a string", () => {
            expect(() => assertKey("https://example.com")).toThrow(TypeError);
        });

        it("throws TypeError for a number", () => {
            expect(() => assertKey(123 as unknown)).toThrow(TypeError);
        });

        it("throws TypeError for an object", () => {
            expect(() => assertKey({} as unknown)).toThrow(TypeError);
        });

        it("throws TypeError for undefined", () => {
            expect(() => assertKey(undefined)).toThrow(TypeError);
        });

        it("throws TypeError for null", () => {
            expect(() => assertKey(null)).toThrow(TypeError);
        });
    });
});
