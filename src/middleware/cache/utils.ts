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
const VARY_WILDCARD = "*" as const;

/**
 * The list of request headers that are considered when generating a cache key
 * for Cloudflare’s Cache API. Only these headers are respected by the cache and
 * can affect the response returned from `cache.match()`.
 *
 * These headers correspond to HTTP preconditions or range requests:
 *
 * - `If-None-Match`: Used to validate ETag for
 *   conditional GET requests. Enables 304 Not Modified responses.
 * - `If-Modified-Since`: Used to validate
 *   Last-Modified timestamps. Also enables 304 responses.
 *
 * Only these headers are copied from the original request when generating a
 * derived `Request` key for cache lookups. All other headers are ignored.
 */
const CACHE_REQUEST_KEY_HEADERS = [HttpHeader.IF_NONE_MATCH, HttpHeader.IF_MODIFIED_SINCE] as const;

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
 * Creates a new `Request` suitable for a Cloudflare cache key.
 *
 * Only the headers listed in `CACHE_REQUEST_KEY_HEADERS` are copied from the
 * original request headers. These are the headers that affect Cloudflare caching:
 * - `If-None-Match`: conditional GET based on ETag (enables 304 Not Modified)
 * - `If-Modified-Since`: conditional GET based on Last-Modified (enables 304)
 *
 * All other headers are ignored and NOT copied to the request key.
 *
 * @param headers The Request headers to filter for cache relevance.
 * @param key The URL generated by the getKey cache function.
 * @returns A new `Request` with only the headers that affect caching
 */
export function getRequestKey(headers: Headers, key: URL): Request {
    const request = new Request(key.toString());

    for (const name of CACHE_REQUEST_KEY_HEADERS) {
        const value = headers.get(name);
        if (value !== null) {
            request.headers.set(name, value);
        }
    }
    return request;
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
 * @param headers The Request headers to check for variance.
 * @param vary Array of header names from the `Vary` header that affect caching.
 * @returns A URL representing a unique cache key for this request + Vary headers.
 */
export function getVaryKey(headers: Headers, key: URL, vary: string[]): URL {
    const varyPairs: [string, string][] = [];
    const filtered = getFilteredVary(vary);

    for (const header of filtered) {
        const value = headers.get(header);
        if (value !== null) {
            varyPairs.push([header, normalizeVaryValue(header, value)]);
        }
    }

    const encoded = base64UrlEncode(JSON.stringify([key.toString(), varyPairs]));
    return new URL(encoded, VARY_CACHE_URL);
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
        binary += String.fromCharCode(byte); // NOSONAR
    }
    return btoa(binary)
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replace(/={1,2}$/, "");
}

/**
 * Decodes a URL-safe Base64 string back to a UTF-8 string.
 * - Converts `-` back to `+` and `_` back to `/`
 * - Pads with `=` to make length a multiple of 4
 * - Base64-decodes to binary
 * - Converts binary to UTF-8 string
 *
 * @param str The URL-safe Base64 string to decode.
 * @returns The decoded UTF-8 string.
 */
export function base64UrlDecode(str: string): string {
    const binary = atob(
        str
            .replaceAll("-", "+")
            .replaceAll("_", "/")
            .padEnd(Math.ceil(str.length / 4) * 4, "="),
    );
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i); // NOSONAR
    }
    return new TextDecoder().decode(bytes);
}

/**
 * Adds debug headers to a Response for inspection of caching behavior.
 *
 * This utility clones the given response and appends headers that provide:
 * - The full request URL (`CACHE_KEY`)
 * - All request headers serialized (`CACHE_REQUEST_HEADERS`)
 * - Optionally, the decoded cache key if the request is for the VARY_CACHE_URL (`CACHE_DECODED_KEY`)
 *
 * @param {Request} request - The request containing the formatted lookup key.
 * @param {Response} response - The Response object on which to apply headers.
 * @returns {Response} A copy of the response with debug headers.
 */
export function addDebugHeaders(request: Request, response: Response): Response {
    const headers = new Headers(response.headers);
    const url = new URL(request.url);

    headers.append(HttpHeader.CACHE_KEY, url.toString());
    headers.append(
        HttpHeader.CACHE_REQUEST_HEADERS,
        [...request.headers].map(([k, v]) => `${k}: ${v}`).join(", ") || "none",
    );
    if (url.origin === VARY_CACHE_URL) {
        headers.append(HttpHeader.CACHE_DECODED_KEY, base64UrlDecode(url.pathname.slice(1)));
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}
