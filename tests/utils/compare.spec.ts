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

import { lexCompare, stringArraysEqual } from "@src/utils/compare";
import { describe, expect, it } from "vitest";

describe("compare function unit test", () => {
    it("sorts strings lexicographically", () => {
        const arr = ["banana", "apple", "cherry"];
        arr.sort(lexCompare);
        expect(arr).toEqual(["apple", "banana", "cherry"]);
    });

    describe("stringArraysEqual", () => {
        it("returns true for two empty arrays", () => {
            expect(stringArraysEqual([], [])).toBe(true);
        });

        it("returns true for identical arrays", () => {
            const a = ["Accept", "Content-Type", "Vary"];
            const b = ["Accept", "Content-Type", "Vary"];
            expect(stringArraysEqual(a, b)).toBe(true);
        });

        it("returns true when comparing the same array reference", () => {
            const a = ["Origin", "Accept-Language"];
            expect(stringArraysEqual(a, a)).toBe(true);
        });

        it("returns false if arrays differ in length", () => {
            const a = ["A", "B", "C"];
            const b = ["A", "B"];
            expect(stringArraysEqual(a, b)).toBe(false);
        });

        it("returns false if one array is empty and the other is not", () => {
            expect(stringArraysEqual([], ["A"])).toBe(false);
            expect(stringArraysEqual(["A"], [])).toBe(false);
        });

        it("returns false if any element differs", () => {
            const a = ["Accept", "Content-Type"];
            const b = ["Accept", "Content-Length"];
            expect(stringArraysEqual(a, b)).toBe(false);
        });

        it("returns false if order differs even with same elements", () => {
            const a = ["A", "B", "C"];
            const b = ["C", "B", "A"];
            expect(stringArraysEqual(a, b)).toBe(false);
        });

        it("handles case sensitivity strictly", () => {
            const a = ["accept"];
            const b = ["Accept"];
            expect(stringArraysEqual(a, b)).toBe(false);
        });

        it("returns true for single-element identical arrays", () => {
            expect(stringArraysEqual(["X-Test"], ["X-Test"])).toBe(true);
        });

        it("returns false for single-element different arrays", () => {
            expect(stringArraysEqual(["X-Test"], ["Y-Test"])).toBe(false);
        });

        it("does not mutate input arrays", () => {
            const a = ["A", "B"];
            const b = ["A", "B"];
            const cloneA = [...a];
            const cloneB = [...b];
            stringArraysEqual(a, b);
            expect(a).toEqual(cloneA);
            expect(b).toEqual(cloneB);
        });

        it("returns false when one array contains undefined and the other does not", () => {
            const a = ["A", undefined as unknown as string];
            const b = ["A", "B"];
            expect(stringArraysEqual(a, b)).toBe(false);
        });

        it("returns true when both arrays contain identical undefined elements", () => {
            const a = [undefined as unknown as string];
            const b = [undefined as unknown as string];
            expect(stringArraysEqual(a, b)).toBe(true);
        });
    });
});
