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

import { HttpHeader } from "../../../constants/headers";
import { getHeaderValues } from "../../../utils/headers";
import { ByteRange, CacheValidators } from "./interfaces";
import { CacheControl } from "../../../constants";

const RANGE_REGEX = /^bytes=(\d{1,12})-(\d{0,12})$/;

/**
 * Parses the `Range` header from an HTTP request and returns a byte range object.
 *
 * Only supports **single-range headers** of the form `bytes=X-Y` or `bytes=X-`.
 * - `X` (start) is **required** and must be a whole number (up to 12 digits).
 * - `Y` (end) is optional; if missing, `end` is `undefined`.
 *
 * @param request - The HTTP request object containing headers
 * @returns A ByteRange object with `start` and optional `end` if a valid range is found,
 *          otherwise `undefined`.
 */
export function getRange(request: Request): ByteRange | undefined {
    const range = request.headers.get("range");
    if (!range) return;

    const match = RANGE_REGEX.exec(range);
    if (!match) return;

    const start = Number(match[1]);
    const end = match[2] === "" ? undefined : Number(match[2]);

    return end !== undefined ? { start, end } : { start };
}

/** Normalizes an ETag for weak comparison (strips "W/" prefix). */
export function normalizeWeak(etag: string): string {
    return etag.startsWith("W/") ? etag.slice(2) : etag;
}

/** Normalizes an ETag for strong comparison (no changes). */
export function normalizeStrong(etag: string): string {
    return etag;
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
 * Extracts cache validators from request headers.
 *
 * Cache validators allow conditional requests against cached resources.
 * They let clients revalidate instead of always re-downloading.
 *
 * Recognized validators:
 * - `If-None-Match` (ETag weak comparison)
 * - `If-Match` (ETag strong comparison)
 * - `If-Modified-Since` (date-based comparison)
 *
 * @param headers - The request headers to inspect.
 * @returns Object containing the parsed cache validators.
 */
export function getCacheValidators(headers: Headers): CacheValidators {
    return {
        ifNoneMatch: getHeaderValues(headers, HttpHeader.IF_NONE_MATCH),
        ifMatch: getHeaderValues(headers, HttpHeader.IF_MATCH),
        ifModifiedSince: headers.get(HttpHeader.IF_MODIFIED_SINCE),
    };
}

/**
 * Returns true if any cache validator headers are present.
 *
 * Useful as a quick check for conditional requests where the
 * specific values are not important.
 *
 * @param headers - The request headers to inspect.
 * @returns `true` if any validator exists, otherwise `false`.
 */
export function hasCacheValidator(headers: Headers): boolean {
    const { ifNoneMatch, ifMatch, ifModifiedSince } = getCacheValidators(headers);
    return ifNoneMatch.length > 0 || ifMatch.length > 0 || ifModifiedSince !== null;
}
