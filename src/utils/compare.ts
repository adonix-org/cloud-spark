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

/**
 * Lexicographically compares two strings.
 *
 * This comparator can be used in `Array.prototype.sort()` to produce a
 * consistent, stable ordering of string arrays.
 *
 * @param a - The first string to compare.
 * @param b - The second string to compare.
 * @returns A number indicating the relative order of `a` and `b`.
 */
export function lexCompare(a: string, b: string): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

/**
 * Compares two string arrays for exact equality.
 *
 * Two arrays are considered equal if they have the same length
 * and all corresponding elements are strictly equal (===) in order.
 *
 * This is a shallow comparison; it does not compare nested objects or arrays.
 *
 * @param a - The first string array to compare.
 * @param b - The second string array to compare.
 * @returns `true` if the arrays are identical in length and content, otherwise `false`.
 */
export function stringArraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}
