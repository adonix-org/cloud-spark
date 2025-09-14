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
    if (values.length === 0) return;

    const existing = getHeaderValues(headers, key);
    const merged = existing.concat(values.map((v) => v.trim()));

    setHeader(headers, key, merged);
}

/**
 * Returns the values of an HTTP header as an array of strings.
 *
 * This helper:
 * - Retrieves the header value by `key`.
 * - Splits the value on commas.
 * - Trims surrounding whitespace from each entry.
 * - Filters out any empty tokens.
 * - Removes duplicate values (case-sensitive)
 *
 * If the header is not present, an empty array is returned.
 *
 */
export function getHeaderValues(headers: Headers, key: string): string[] {
    const values =
        headers
            .get(key)
            ?.split(",")
            .map((v) => v.trim())
            .filter((v) => v.length > 0) ?? [];
    return Array.from(new Set(values)).sort(lexCompare);
}
