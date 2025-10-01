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

import { ByteRange, RANGE_REGEX } from "./constants";

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

