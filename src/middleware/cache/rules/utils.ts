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
import { isNumber } from "../../../guards/basic";

import { ByteRange } from "./interfaces";

const RANGE_REGEX = /^bytes=(\d{1,12})-(\d{0,12})$/;

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
    return headers.has(HttpHeader.IF_NONE_MATCH) || headers.has(HttpHeader.IF_MODIFIED_SINCE);
}
