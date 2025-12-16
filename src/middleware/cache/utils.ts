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

import { CacheControl, GET, StatusCodes } from "../../constants";
import { HttpHeader } from "../../constants/headers";
import { lexCompare } from "../../utils/compare";
import { getHeaderValues } from "../../utils/headers";

/** Base URL used for constructing cache keys. Only used internally. */
const VARY_CACHE_URL = "https://vary";

/**
 * Wildcard member (`*`) for the `Vary` header.
 *
 * When present, it indicates that the response can vary based on unspecified
 * request headers. Such a response **MUST NOT be stored by a shared cache**,
 * since it cannot be reliably reused for any request.
 *
 * Example:
 * ```http
 * Vary: *
 * ```
 */
const VARY_WILDCARD = "*";

/**
 * Determines whether a given Response is safe to cache.
 *
 * Internal utility used by the caching pipeline to decide if a response
 * should be stored in the cache. Returns `true` only if:
 *
 *   - The response status is `200 OK`.
 *   - The request method is `GET`.
 *   - The response does not have a `Vary` header containing `*`.
 *   - The response has TTL specified in max-age or s-maxage.
 *   - Neither the request nor the response has `Cache-Control: no-store`.
 *   - The response is not marked `private` and does not specify `max-age=0`.
 *   - The request does **not** include sensitive headers such as `Authorization` or `Cookie`.
 *   - The response does **not** include a `Set-Cookie` header.
 *   - The response does not include a `Content-Range` header (partial content).
 *
 * These checks collectively ensure that the response is publicly cacheable,
 * consistent with Cloudflare's and general HTTP caching rules.
 *
 * @param request - The incoming Request object.
 * @param response - The Response object generated for the request.
 * @returns `true` if the response can safely be cached; `false` otherwise.
 * @throws Error If a 200 OK response contains a Content-Range header.
 */
export function isCacheable(request: Request, response: Response): boolean {
    if (response.status !== StatusCodes.OK) return false;
    if (request.method !== GET) return false;

    if (request.headers.has(HttpHeader.AUTHORIZATION)) return false;
    if (request.headers.has(HttpHeader.COOKIE)) return false;

    const requestCacheControl = getCacheControl(request.headers);
    if (requestCacheControl["no-store"]) return false;

    if (!response.headers.has(HttpHeader.CACHE_CONTROL)) return false;
    const responseCacheControl = getCacheControl(response.headers);
    const ttl = responseCacheControl["s-maxage"] ?? responseCacheControl["max-age"];
    if (ttl === undefined || ttl === 0) return false;
    if (responseCacheControl["no-store"]) return false;
    if (responseCacheControl["no-cache"]) return false;
    if (responseCacheControl["private"]) return false;

    if (response.headers.has(HttpHeader.SET_COOKIE)) return false;
    if (getVaryHeader(response).includes(VARY_WILDCARD)) return false;

    if (response.headers.has(HttpHeader.INTERNAL_VARIANT_SET)) {
        throw new Error("Found conflicting vary header.");
    }

    if (response.headers.has(HttpHeader.CONTENT_RANGE)) {
        throw new Error("Found content-range header on 200 OK. Must use 206 Partial Content");
    }

    return true;
}

/**
 * Parses the Cache-Control header from the given headers.
 *
 * @param headers - The request headers to inspect.
 * @returns A `CacheControl` object.
 */
export function getCacheControl(headers: Headers): CacheControl {
    return CacheControl.parse(headers.get(HttpHeader.CACHE_CONTROL) ?? "");
}

/**
 * Extracts and normalizes the `Vary` header from a Response.
 * - Splits comma-separated values
 * - Deduplicates
 * - Converts all values to lowercase
 * - Sorts lexicographically
 * - Removes `Vary` headers to ignore for caching.
 *
 * @param response The Response object containing headers.
 * @returns An array of normalized header names from the Vary header.
 */
export function getVaryHeader(response: Response): string[] {
    return getFilteredVary(getHeaderValues(response.headers, HttpHeader.VARY));
}

/**
 * Filters out headers that should be ignored for caching, currently:
 * - `Accept-Encoding` (handled automatically by the platform)
 *
 * @param vary Array of normalized Vary header names.
 * @returns Array of headers used for computing cache variations.
 */
export function getFilteredVary(vary: string[]): string[] {
    const values = vary
        .map((h) => h.toLowerCase())
        .filter((value) => value !== HttpHeader.ACCEPT_ENCODING)
        .sort(lexCompare);
    return Array.from(new Set(values));
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
 * @param request The Request object used to generate the key.
 * @param vary Array of header names from the `Vary` header that affect caching.
 * @param key The cache key to be used for this request. Can be modified by the caller for
 *            custom cache key behavior.
 * @returns A URL representing a unique cache key for this request + Vary headers.
 */
export function getVaryKey(request: Request, vary: string[]): string {
    const varyPairs: [string, string][] = [];
    const filtered = getFilteredVary(vary);

    for (const header of filtered) {
        const value = request.headers.get(header);
        if (value !== null) {
            varyPairs.push([header, normalizeVaryValue(header, value)]);
        }
    }

    const encoded = base64UrlEncode(JSON.stringify([request.url, varyPairs]));
    return new URL(encoded, VARY_CACHE_URL).toString();
}

/**
 * Normalizes the value of a header used in a Vary key.
 *
 * Only lowercases headers that are defined as case-insensitive
 * by HTTP standards and commonly used for content negotiation.
 *
 * @param name - The header name (case-insensitive).
 * @param value - The header value as received from the request.
 * @returns The normalized header value.
 */
export function normalizeVaryValue(name: string, value: string): string {
    switch (name.toLowerCase()) {
        case HttpHeader.ACCEPT:
        case HttpHeader.ACCEPT_LANGUAGE:
        case HttpHeader.ORIGIN:
            return value.toLowerCase();
        default:
            return value;
    }
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
