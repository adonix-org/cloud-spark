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

export const Time = {
    Second: 1,
    Minute: 60,
    Hour: 60 * 60,
    Day: 60 * 60 * 24,
    Week: 60 * 60 * 24 * 7,
} as const;

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

export function isMethod(value: string): value is Method {
    return METHOD_SET.has(value);
}

export function ensure<K, V>(map: Map<K, V>, key: K, factory: () => V): V {
    let value = map.get(key);
    if (value === undefined) {
        value = factory();
        map.set(key, value);
    }
    return value;
}

export function getContentType(type: MimeType): string {
    if (ADD_CHARSET.has(type)) {
        return `${type}; charset=utf-8`;
    }
    return type;
}

export enum MimeType {
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

const ADD_CHARSET: Set<MimeType> = new Set([
    MimeType.PLAIN_TEXT,
    MimeType.HTML,
    MimeType.CSS,
    MimeType.CSV,
    MimeType.MARKDOWN,
    MimeType.XML,
    MimeType.JSON,
    MimeType.XML_APP,
    MimeType.FORM_URLENCODED,
    MimeType.NDJSON,
    MimeType.RICH_TEXT,
    MimeType.SVG,
]);
