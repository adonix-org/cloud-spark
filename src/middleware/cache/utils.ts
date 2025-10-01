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

import { StatusCodes } from "http-status-codes";
import { HttpHeader } from "../../constants/headers";
import { lexCompare } from "../../utils/compare";
import { getHeaderValues } from "../../utils/headers";
import { VARY_WILDCARD } from "./constants";

/** Base URL used for constructing cache keys. Only used internally. */
const VARY_CACHE_URL = "https://vary";


/**
 * Determines whether a Response is cacheable.
 * - Status must be 200 OK
 * - Must not contain a Vary header with a wildcard (`*`)
 *
 * @param response The Response object to check.
 * @returns `true` if the response can be cached; `false` otherwise.
 */
export function isCacheable(response: Response): boolean {
    if (response.status !== StatusCodes.OK) return false;
    if (getVaryHeader(response).includes(VARY_WILDCARD)) return false;

    return true;
}

export function isConditionalGet(request: Request, response: Response): boolean {
    const etag = response.headers.get(HttpHeader.ETAG);
    const ifNoneMatch = getHeaderValues(request.headers, HttpHeader.IF_NONE_MATCH);

    return etag !== null && etag !== "" && ifNoneMatch.length > 0;
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
export function filterVaryHeader(vary: string[]): string[] {
    return vary
        .map((h) => h.toLowerCase())
        .filter((value) => value !== HttpHeader.ACCEPT_ENCODING.toLowerCase());
}

/**
 * Generates a Vary-aware cache key for a request.
 *
 * The key is based on:
 * 1. The provided `key` URL, which is normalized by default but can be fully customized
 *    by the caller. For example, users can:
 *      - Sort query parameters
 *      - Remove the search/query string entirely
 *      - Exclude certain query parameters
 *    This allows full control over how this cache key is generated.
 * 2. The request headers listed in `vary` (after filtering and lowercasing).
 *
 * Behavior:
 * - Headers in `vary` are sorted and included in the key.
 * - The combination of the key URL and header values is base64-encoded to produce
 *   a safe cache key.
 * - The resulting string is returned as an absolute URL rooted at `VARY_CACHE_URL`.
 *
 * @param request The Request object to generate a key for.
 * @param vary Array of header names from the `Vary` header that affect caching.
 * @param key The cache key to be used for this request. Can be modified by the caller for
 *            custom cache key behavior.
 * @returns A string URL representing a unique cache key for this request + Vary headers.
 */
export function getVaryKey(request: Request, vary: string[], key: URL): string {
    const varyPairs: [string, string][] = [];
    const filtered = filterVaryHeader(vary);

    filtered.sort(lexCompare);
    for (const header of filtered) {
        const value = request.headers.get(header);
        if (value !== null) {
            varyPairs.push([header, value]);
        }
    }

    const encoded = base64UrlEncode(JSON.stringify([key.toString(), varyPairs]));
    return new URL(encoded, VARY_CACHE_URL).href;
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
    let binary = "";
    for (const byte of utf8) {
        binary += String.fromCodePoint(byte);
    }
    return btoa(binary)
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replace(/={1,2}$/, "");
}
