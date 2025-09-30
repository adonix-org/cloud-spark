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
import { assertOctetStreamInit } from "@src/guards/responses";

describe("responses guard unit tests", () => {
    describe("assert octet stream init function", () => {
        it("passes with just size", () => {
            const init = { size: 100 };
            expect(() => assertOctetStreamInit(init)).not.toThrow();
        });

        it("passes with offset and length within bounds", () => {
            const init = { size: 100, offset: 10, length: 20 };
            expect(() => assertOctetStreamInit(init)).not.toThrow();
        });

        it("passes with only offset", () => {
            const init = { size: 50, offset: 25 };
            expect(() => assertOctetStreamInit(init)).not.toThrow();
        });

        it("passes with only length", () => {
            const init = { size: 50, length: 10 };
            expect(() => assertOctetStreamInit(init)).not.toThrow();
        });

        it("throws TypeError if value is not an object", () => {
            expect(() => assertOctetStreamInit(null)).toThrow(TypeError);
            expect(() => assertOctetStreamInit(42)).toThrow(TypeError);
            expect(() => assertOctetStreamInit("foo")).toThrow(TypeError);
        });

        it("throws RangeError for negative size", () => {
            expect(() => assertOctetStreamInit({ size: -1 })).toThrow(RangeError);
        });

        it("throws RangeError for offset out of bounds", () => {
            expect(() => assertOctetStreamInit({ size: 10, offset: -1 })).toThrow(RangeError);
            expect(() => assertOctetStreamInit({ size: 10, offset: 11 })).toThrow(RangeError);
        });

        it("throws RangeError for length out of bounds", () => {
            expect(() => assertOctetStreamInit({ size: 10, offset: 5, length: 6 })).toThrow(
                RangeError,
            );
            expect(() => assertOctetStreamInit({ size: 10, length: -1 })).toThrow(RangeError);
        });

        it("handles offset = 0 and length = size correctly", () => {
            const init = { size: 10, offset: 0, length: 10 };
            expect(() => assertOctetStreamInit(init)).not.toThrow();
        });
    });
});
