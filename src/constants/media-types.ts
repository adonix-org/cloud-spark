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
 * Common media types used for HTTP headers.
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
