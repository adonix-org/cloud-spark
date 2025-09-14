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

import { MediaType } from "../constants/media-types";

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
