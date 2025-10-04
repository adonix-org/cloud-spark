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
import { isNumber, isString } from "../../../guards/basic";

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
 * @param request - The HTTP request object containing headers
 * @returns A ByteRange object with `start` and optional `end` if a valid range is found,
 *          otherwise `undefined`.
 */
export function getRange(request: Request): ByteRange | undefined {
    const range = request.headers.get(HttpHeader.RANGE);
    if (!range) return;

    const match = RANGE_REGEX.exec(range);
    if (!match) return;

    const start = Number(match[1]);
    const end = match[2] === "" ? undefined : Number(match[2]);

    return end !== undefined ? { start, end } : { start };
}

export function getEtag(response: Response): string | undefined {
    const etag = response.headers.get(HttpHeader.ETAG);
    if (etag) return etag;

    return undefined;
}

export function isPreconditionFailed(ifMatch: string[], etag: string): boolean {
    return ifMatch.length > 0 && !found(ifMatch, etag, WILDCARD_ETAG);
}

export function isNotModified(ifNoneMatch: string[], etag: string): boolean {
    return ifNoneMatch.length > 0 && found(ifNoneMatch, normalizeEtag(etag), WILDCARD_ETAG);
}

export function found(array: string[], ...search: string[]): boolean {
    return array.some((value) => search.includes(value));
}

export function toDate(value: unknown): number | undefined {
    if (!isString(value)) return;

    const date = Date.parse(value);
    return isNaN(date) ? undefined : date;
}

/** Normalizes an ETag for comparison */
export function normalizeEtag(etag: string): string {
    return etag.startsWith(ETAG_WEAK_PREFIX) ? etag.slice(2) : etag;
}

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
 * @returns `true` if any validator exists, otherwise `false`.
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
 * Safely extracts Content-Length from headers.
 *
 * Returns the length as a number if present and valid.
 * Returns `undefined` if the header is missing, empty, or not a valid number.
 *
 * @param headers - The headers object to read from.
 */
export function getContentLength(headers: Headers): number | undefined {
    const lengthHeader = headers.get(HttpHeader.CONTENT_LENGTH);
    if (lengthHeader === null) return;
    if (lengthHeader.trim() === "") return;

    const length = Number(lengthHeader);
    if (!isNumber(length)) return;

    return length;
}
