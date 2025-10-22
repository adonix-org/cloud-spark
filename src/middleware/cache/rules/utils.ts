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
import { isNumber, isString } from "../../../guards/basic";
import { getHeaderValues } from "../../../utils/headers";

import { ByteRange, CacheValidators } from "./interfaces";

const RANGE_REGEX = /^bytes=(\d{1,12})-(\d{0,12})$/;
const ETAG_WEAK_PREFIX = "W/";
const WILDCARD_ETAG = "*";

/**
 * Parses the `Range` header from an HTTP request and returns a byte range object.
 *
 * Only supports **single-range headers** of the form `bytes=X-Y` or `bytes=X-`.
 * - `X` (start) is **required** and must be a whole number (up to 12 digits).
 * - `Y` (end) is optional; if missing, `end` is `undefined`.
 *
 * @param request - The HTTP request object containing headers.
 * @returns A `ByteRange` object with `start` and optional `end` if valid; otherwise `undefined`.
 */
export function getRange(request: Request): ByteRange | undefined {
    const range = request.headers.get(HttpHeader.RANGE);
    if (!range) return;

    const match = RANGE_REGEX.exec(range);
    if (!match) return;

    const start = Number(match[1]);
    const end = match[2] === "" ? undefined : Number(match[2]);

    return end === undefined ? { start } : { start, end };
}

/**
 * Evaluates an `If-Match` precondition against the current ETag.
 *
 * Returns `true` when the precondition fails, meaning the resource’s
 * current ETag does **not** match any of the supplied `If-Match` values
 * and the request should return **412 Precondition Failed**.
 *
 * @param ifMatch - Parsed `If-Match` header values.
 * @param etag - Current entity tag for the resource.
 * @returns `true` if the precondition fails; otherwise `false`.
 */
export function isPreconditionFailed(ifMatch: string[], etag: string): boolean {
    return ifMatch.length > 0 && !found(ifMatch, etag, WILDCARD_ETAG);
}

/**
 * Evaluates an `If-None-Match` precondition against the current ETag.
 *
 * Returns `true` when the resource has **not** been modified since the
 * validator was issued — i.e., when the normalized ETag matches one of
 * the `If-None-Match` values or the wildcard `"*"`.
 *
 * @param ifNoneMatch - Parsed `If-None-Match` header values.
 * @param etag - Current entity tag for the resource.
 * @returns `true` if the response should return **304 Not Modified**; otherwise `false`.
 */
export function isNotModified(ifNoneMatch: string[], etag: string): boolean {
    return found(ifNoneMatch, normalizeEtag(etag), WILDCARD_ETAG);
}

/**
 * Determines whether any of the given search values appear in the array.
 *
 * @param array - The array to search.
 * @param search - One or more values to look for.
 * @returns `true` if any search value is found in the array; otherwise `false`.
 */
export function found(array: string[], ...search: string[]): boolean {
    return array.some((value) => search.includes(value));
}

/**
 * Parses a date string into a timestamp (milliseconds since epoch).
 *
 * Returns `undefined` for invalid, null, or non-string values.
 *
 * @param value - The date string to parse.
 * @returns Parsed timestamp if valid; otherwise `undefined`.
 */
export function toDate(value: string | null | undefined): number | undefined {
    if (!isString(value)) return undefined;

    const date = Date.parse(value);
    return Number.isNaN(date) ? undefined : date;
}

/**
 * Normalizes an ETag for equality comparison.
 *
 * Weak ETags (`W/"etag"`) are converted to their strong form by removing
 * the leading `W/` prefix. Strong ETags are returned unchanged.
 *
 * @param etag - The entity tag to normalize.
 * @returns The normalized ETag string.
 */
export function normalizeEtag(etag: string): string {
    return etag.startsWith(ETAG_WEAK_PREFIX) ? etag.slice(2) : etag;
}

/**
 * Extracts cache validator headers from a request.
 *
 * Returns an object containing all standard conditional request headers:
 * - `If-Match` (weak validators removed)
 * - `If-None-Match` (normalized)
 * - `If-Modified-Since`
 * - `If-Unmodified-Since`
 *
 * @param headers - The headers object from which to extract validators.
 * @returns A `CacheValidators` structure containing parsed header values.
 */
export function getCacheValidators(headers: Headers): CacheValidators {
    return {
        ifMatch: getHeaderValues(headers, HttpHeader.IF_MATCH).filter(
            (value) => !value.startsWith(ETAG_WEAK_PREFIX),
        ),
        ifNoneMatch: getHeaderValues(headers, HttpHeader.IF_NONE_MATCH).map(normalizeEtag),
        ifModifiedSince: headers.get(HttpHeader.IF_MODIFIED_SINCE),
        ifUnmodifiedSince: headers.get(HttpHeader.IF_UNMODIFIED_SINCE),
    };
}

/**
 * Returns true if any cache validator headers are present.
 *
 * Useful as a quick check for conditional requests where the
 * specific values are not important.
 *
 * @param headers - The request headers to inspect.
 * @returns `true` if any validator exists; otherwise `false`.
 */
export function hasCacheValidator(headers: Headers): boolean {
    const { ifNoneMatch, ifMatch, ifModifiedSince, ifUnmodifiedSince } =
        getCacheValidators(headers);
    return (
        ifNoneMatch.length > 0 ||
        ifMatch.length > 0 ||
        ifModifiedSince !== null ||
        ifUnmodifiedSince !== null
    );
}

/**
 * Safely extracts the `Content-Length` header value.
 *
 * Returns the length as a number if present and valid. Returns `undefined`
 * if the header is missing, empty, or not a valid number.
 *
 * @param headers - The headers object to read from.
 * @returns Parsed content length if valid; otherwise `undefined`.
 */
export function getContentLength(headers: Headers): number | undefined {
    const lengthHeader = headers.get(HttpHeader.CONTENT_LENGTH);
    if (lengthHeader === null) return;
    if (lengthHeader.trim() === "") return;

    const length = Number(lengthHeader);
    if (!isNumber(length)) return;

    return length;
}
