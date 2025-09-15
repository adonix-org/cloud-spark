/*
 * Copyright (C) 2025 Ty Busby
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
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

import { HttpHeader } from "../../constants/http";
import { getHeaderValues, lexCompare } from "../../utils";
import { VARY_WILDCARD } from "./constants";

/** Base URL used for constructing cache keys. Only used internally. */
const BASE_CACHE_URL = "https://cache";

/**
 * Determines whether a Response is cacheable.
 * - Must have `ok` status (2xx-3xx)
 * - Must not contain a Vary header with a wildcard (`*`)
 *
 * @param response The Response object to check.
 * @returns `true` if the response can be cached; `false` otherwise.
 */
export function isCacheable(response: Response): boolean {
    if (!response.ok) return false;
    if (getVaryHeader(response).includes(VARY_WILDCARD)) return false;

    return true;
}

/**
 * Extracts and normalizes the `Vary` header from a Response.
 * - Splits comma-separated values
 * - Deduplicates
 * - Converts all values to lowercase
 * - Sorts lexicographically
 *
 * @param response The Response object containing headers.
 * @returns An array of normalized header names from the Vary header.
 */
export function getVaryHeader(response: Response): string[] {
    const values = getHeaderValues(response.headers, HttpHeader.VARY);
    return Array.from(new Set(values.map((v) => v.toLowerCase()))).sort(lexCompare);
}

/**
 * Filters out headers that should be ignored for caching, currently:
 * - `Accept-Encoding` (handled automatically by the platform)
 *
 * @param vary Array of normalized Vary header names.
 * @returns Array of headers used for computing cache variations.
 */
export function getVaryFiltered(vary: string[]): string[] {
    return vary
        .map((h) => h.toLowerCase())
        .filter((value) => value !== HttpHeader.ACCEPT_ENCODING.toLowerCase());
}

/**
 * Generates a Vary-aware cache key for a request.
 *
 * The key is based on:
 * 1. The provided `baseUrl`, which is normalized by default but can be fully customized
 *    by the caller. For example, users can:
 *      - Sort query parameters
 *      - Remove the search/query string entirely
 *      - Exclude certain query parameters
 *    This allows full control over how this cache key is generated.
 * 2. The request headers listed in `vary` (after filtering and lowercasing).
 *
 * Behavior:
 * - Headers in `vary` are sorted and included in the key.
 * - The combination of URL and header values is base64-encoded to produce
 *   a safe cache key.
 * - The resulting string is returned as an absolute URL rooted at `BASE_CACHE_URL`.
 *
 * @param request The Request object to generate a key for.
 * @param vary Array of header names from the `Vary` header that affect caching.
 * @param baseUrl The base URL to use for the main cache key. Can be modified
 *                by the caller for custom cache key behavior.
 * @returns A string URL representing a unique cache key for this request + Vary headers.
 */
export function getVaryKey(request: Request, vary: string[], baseUrl: URL): string {
    const varyPairs: [string, string][] = [];
    const filtered = getVaryFiltered(vary);

    filtered.sort(lexCompare);
    filtered.forEach((header) => {
        const value = request.headers.get(header);
        if (value !== null) {
            varyPairs.push([header, value]);
        }
    });

    const encoded = base64UrlEncode(JSON.stringify([baseUrl.toString(), varyPairs]));
    return new URL(encoded, BASE_CACHE_URL).href;
}

/**
 * Encodes a string as URL-safe Base64.
 * - Converts to UTF-8 bytes
 * - Base64-encodes
 * - Replaces `+` with `-` and `/` with `_`
 * - Removes trailing `=`
 *
 * @param str The input string to encode.
 * @returns URL-safe Base64 string.
 */
export function base64UrlEncode(str: string): string {
    const utf8 = new TextEncoder().encode(str);
    let base64 = btoa(String.fromCharCode(...utf8));
    while (base64.endsWith("=")) {
        base64 = base64.slice(0, -1);
    }
    return base64.replace(/\+/g, "-").replace(/\//g, "_");
}
