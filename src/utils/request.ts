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

import { HttpHeader, Method } from "../constants/http";
import { MediaType } from "../constants/media-types";

/**
 * A set containing all supported HTTP methods.
 *
 * Useful for runtime checks like validating request methods.
 */
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
 * A set of media types that require a `charset` parameter when setting
 * the `Content-Type` header.
 *
 * This includes common text-based media types such as HTML, CSS, JSON,
 * XML, CSV, Markdown, and others.
 */
const ADD_CHARSET: Set<MediaType> = new Set([
    MediaType.CSS,
    MediaType.CSV,
    MediaType.XML,
    MediaType.SVG,
    MediaType.HTML,
    MediaType.JSON,
    MediaType.NDJSON,
    MediaType.XML_APP,
    MediaType.MARKDOWN,
    MediaType.RICH_TEXT,
    MediaType.PLAIN_TEXT,
    MediaType.FORM_URLENCODED,
]);

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
 * Extracts and normalizes the `Origin` header from a request.
 *
 * Returns the origin (scheme + host + port) as a string if present and valid.
 * Returns `null` if:
 *   - The `Origin` header is missing
 *   - The `Origin` header is `"null"` (opaque origin)
 *   - The `Origin` header is malformed
 *
 * @param request - The incoming {@link Request} object.
 * @returns The normalized origin string, or `null` if not present or invalid.
 */
export function getOrigin(request: Request): string | null {
    const origin = request.headers.get(HttpHeader.ORIGIN)?.trim();
    if (!origin || origin === "null") return null;

    try {
        return new URL(origin).origin;
    } catch {
        return null;
    }
}
