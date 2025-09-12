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

import { lexCompare } from "./compare";

/**
 * Sets a header on the given Headers object.
 *
 * - If `value` is an array, any duplicates and empty strings are removed.
 * - If the resulting value is empty, the header is deleted.
 * - Otherwise, values are joined with `", "` and set as the header value.
 *
 * @param headers - The Headers object to modify.
 * @param key - The header name to set.
 * @param value - The header value(s) to set. Can be a string or array of strings.
 */
export function setHeader(headers: Headers, key: string, value: string | string[]): void {
    const raw = Array.isArray(value) ? value : [value];
    const values = Array.from(new Set(raw.map((v) => v.trim())))
        .filter((v) => v.length)
        .sort(lexCompare);

    if (!values.length) {
        headers.delete(key);
        return;
    }

    headers.set(key, values.join(", "));
}

/**
 * Merges new value(s) into an existing header on the given Headers object.
 *
 * - Preserves any existing values and adds new ones.
 * - Removes duplicates and trims all values.
 * - If the header does not exist, it is created.
 * - If the resulting value array is empty, the header is deleted.
 *
 * @param headers - The Headers object to modify.
 * @param key - The header name to merge into.
 * @param value - The new header value(s) to add. Can be a string or array of strings.
 */
export function mergeHeader(headers: Headers, key: string, value: string | string[]): void {
    const values = Array.isArray(value) ? value : [value];
    if (!values.length) return;

    const existing = headers.get(key);
    if (existing) {
        const merged = existing.split(",").map((v) => v.trim());
        values.forEach((v) => merged.push(v.trim()));
        setHeader(headers, key, merged);
    } else {
        setHeader(headers, key, values);
    }
}
