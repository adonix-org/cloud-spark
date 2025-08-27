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

import CacheLib from "cache-control-parser";

/**
 * @see {@link https://github.com/etienne-martin/cache-control-parser | cache-control-parser}
 */
export type CacheControl = CacheLib.CacheControl;
export const CacheControl = {
    parse: CacheLib.parse,
    stringify: CacheLib.stringify,
};

/**
 * https://github.com/prettymuchbryce/http-status-codes
 */
export { StatusCodes } from "http-status-codes";

/**
 * Standard HTTP header names and common values.
 */
export namespace HttpHeader {
    export const VARY = "Vary";
    export const CONTENT_TYPE = "Content-Type";
    export const CACHE_CONTROL = "Cache-Control";

    // Security Headers
    export const X_CONTENT_TYPE_OPTIONS = "X-Content-Type-Options"; // usually "nosniff"
    export const X_FRAME_OPTIONS = "X-Frame-Options"; // e.g. "DENY" or "SAMEORIGIN"
    export const STRICT_TRANSPORT_SECURITY = "Strict-Transport-Security"; // e.g. "max-age=63072000; includeSubDomains; preload"
    export const CONTENT_SECURITY_POLICY = "Content-Security-Policy"; // fine-grained script/style/image restrictions
    export const REFERRER_POLICY = "Referrer-Policy"; // e.g. "no-referrer", "strict-origin-when-cross-origin"
    export const PERMISSIONS_POLICY = "Permissions-Policy"; // formerly Feature-Policy, controls APIs like geolocation/camera

    // Values
    export const NOSNIFF = "nosniff";
    export const ORIGIN = "Origin";
}

/**
 * Time constants in seconds. Month is approximated as 30 days.
 */
export const Time = {
    Second: 1,
    Minute: 60,
    Hour: 3600, // 60 * 60
    Day: 86400, // 60 * 60 * 24
    Week: 604800, // 60 * 60 * 24 * 7
    Month: 2592000, // 60 * 60 * 24 * 30
    Year: 31536000, // 60 * 60 * 24 * 365
} as const;

/**
 * Standard HTTP request methods.
 */
export enum Method {
    GET = "GET",
    PUT = "PUT",
    POST = "POST",
    PATCH = "PATCH",
    DELETE = "DELETE",
    HEAD = "HEAD",
    OPTIONS = "OPTIONS",
}
const METHOD_SET: Set<string> = new Set(Object.values(Method));

/**
 * Type guard that checks if a string is a valid HTTP method.
 *
 * @param value - The string to test.
 * @returns True if `value` is a recognized HTTP method.
 */
export function isMethod(value: string): value is Method {
    return METHOD_SET.has(value);
}

/**
 * Returns the proper Content-Type string for a given media type.
 * Appends `charset=utf-8` for text-based types that require it.
 *
 * @param type - The media type.
 * @returns A string suitable for the `Content-Type` header.
 */
export function getContentType(type: MediaType): string {
    if (ADD_CHARSET.has(type)) {
        return `${type}; charset=utf-8`;
    }
    return type;
}

/**
 * Common media types types used for HTTP headers.
 */
export enum MediaType {
    PLAIN_TEXT = "text/plain",
    HTML = "text/html",
    CSS = "text/css",
    CSV = "text/csv",
    XML = "text/xml",
    MARKDOWN = "text/markdown",
    RICH_TEXT = "text/richtext",
    JSON = "application/json",
    XML_APP = "application/xml",
    YAML = "application/x-yaml",
    FORM_URLENCODED = "application/x-www-form-urlencoded",
    NDJSON = "application/x-ndjson",
    MSGPACK = "application/x-msgpack",
    PROTOBUF = "application/x-protobuf",
    MULTIPART_FORM_DATA = "multipart/form-data",
    MULTIPART_MIXED = "multipart/mixed",
    MULTIPART_ALTERNATIVE = "multipart/alternative",
    MULTIPART_DIGEST = "multipart/digest",
    MULTIPART_RELATED = "multipart/related",
    MULTIPART_SIGNED = "multipart/signed",
    MULTIPART_ENCRYPTED = "multipart/encrypted",
    OCTET_STREAM = "application/octet-stream",
    PDF = "application/pdf",
    ZIP = "application/zip",
    GZIP = "application/gzip",
    MSWORD = "application/msword",
    DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    EXCEL = "application/vnd.ms-excel",
    XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    POWERPOINT = "application/vnd.ms-powerpoint",
    PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ICO = "image/x-icon",
    ICO_MS = "image/vnd.microsoft.icon",
    GIF = "image/gif",
    PNG = "image/png",
    JPEG = "image/jpeg",
    WEBP = "image/webp",
    SVG = "image/svg+xml",
    HEIF = "image/heif",
    AVIF = "image/avif",
    EVENT_STREAM = "text/event-stream",
    TAR = "application/x-tar",
    BZIP2 = "application/x-bzip2",
}

/**
 * A set of media types that require a `charset` parameter when setting
 * the `Content-Type` header.
 *
 * This includes common text-based media types such as HTML, CSS, JSON,
 * XML, CSV, Markdown, and others.
 */
const ADD_CHARSET: Set<MediaType> = new Set([
    MediaType.PLAIN_TEXT,
    MediaType.HTML,
    MediaType.CSS,
    MediaType.CSV,
    MediaType.MARKDOWN,
    MediaType.XML,
    MediaType.JSON,
    MediaType.XML_APP,
    MediaType.FORM_URLENCODED,
    MediaType.NDJSON,
    MediaType.RICH_TEXT,
    MediaType.SVG,
]);

/**
 * Sets a header on the given Headers object.
 *
 * - If `value` is an array, duplicates and empty strings are removed.
 * - If the resulting value array is empty, the header is deleted.
 * - Otherwise, values are joined with `", "` and set as the header value.
 *
 * @param headers - The Headers object to modify.
 * @param key - The header name to set.
 * @param value - The header value(s) to set. Can be a string or array of strings.
 */
export function setHeader(headers: Headers, key: string, value: string | string[]): void {
    const raw = Array.isArray(value) ? value : [value];
    const values = Array.from(new Set(raw.map((v) => v.trim()))).filter((v) => v.length);

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

/**
 * Normalizes a URL string for use as a consistent cache key.
 *
 * - Sorts query parameters alphabetically so `?b=2&a=1` and `?a=1&b=2` are treated the same.
 * - Strips fragment identifiers (`#...`) since they are not sent in HTTP requests.
 * - Leaves protocol, host, path, and query values intact.
 *
 * @param url The original URL string to normalize.
 * @returns A normalized URL string suitable for hashing or direct cache key use.
 */
export function normalizeUrl(url: string): URL {
    const u = new URL(url);

    const params = [...u.searchParams.entries()];
    params.sort(([a], [b]) => a.localeCompare(b));

    u.search = params
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
    u.hash = "";

    return u;
}

/**
 * Encodes a given string into Base64 using UTF-8 encoding.
 *
 * This function correctly handles any Unicode characters.
 *
 * @param raw - The input string to encode.
 * @returns The Base64-encoded string.
 */
export function toBase64(raw: string): string {
    const bytes = new TextEncoder().encode(raw);
    let binary = "";
    for (const b of bytes) {
        binary += String.fromCharCode(b);
    }
    return btoa(binary);
}
