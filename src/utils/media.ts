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

/**
 * Appends a charset parameter to a given media type string,
 * avoiding duplicates and ignoring empty charsets.
 *
 * @param {string} mediaType - The MIME type (e.g., "text/html").
 * @param {string} charset - The character set to append (e.g., "utf-8").
 * @returns {string} The media type with charset appended if provided.
 */
export function withCharset(mediaType: string, charset: string): string {
    if (!charset || mediaType.toLowerCase().includes("charset=")) {
        return mediaType;
    }
    return `${mediaType}; charset=${charset.toLowerCase()}`;
}
