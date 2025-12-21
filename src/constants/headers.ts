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
 * Internally used headers.
 */
export const HttpHeader = {
    ACCEPT: "accept",
    ACCEPT_ENCODING: "accept-encoding",
    ACCEPT_LANGUAGE: "accept-language",
    ACCEPT_RANGES: "accept-ranges",
    ALLOW: "allow",
    AUTHORIZATION: "authorization",
    CACHE_CONTROL: "cache-control",
    CONNECTION: "connection",
    CONTENT_DISPOSITION: "content-disposition",
    CONTENT_ENCODING: "content-encoding",
    CONTENT_LANGUAGE: "content-language",
    CONTENT_LENGTH: "content-length",
    CONTENT_RANGE: "content-range",
    CONTENT_TYPE: "content-type",
    CONTENT_MD5: "content-md5",
    COOKIE: "cookie",
    ETAG: "etag",
    IF_MODIFIED_SINCE: "if-modified-since",
    IF_NONE_MATCH: "if-none-match",
    ORIGIN: "origin",
    RANGE: "range",
    SET_COOKIE: "set-cookie",
    VARY: "vary",

    // Cors Headers
    ACCESS_CONTROL_ALLOW_CREDENTIALS: "access-control-allow-credentials",
    ACCESS_CONTROL_ALLOW_HEADERS: "access-control-allow-headers",
    ACCESS_CONTROL_ALLOW_METHODS: "access-control-allow-methods",
    ACCESS_CONTROL_ALLOW_ORIGIN: "access-control-allow-origin",
    ACCESS_CONTROL_EXPOSE_HEADERS: "access-control-expose-headers",
    ACCESS_CONTROL_MAX_AGE: "access-control-max-age",

    // Websocket Headers
    SEC_WEBSOCKET_VERSION: "sec-websocket-version",
    UPGRADE: "upgrade",

    // Internal Headers
    INTERNAL_VARIANT_SET: "cs-internal-variant-set",
    CACHE_KEY: "cs-cache-key",
    CACHE_DECODED_KEY: "cs-cache-decoded-key",
    CACHE_REQUEST_HEADERS: "cs-cache-req-headers",
} as const;

/**
 * Headers that must not be sent in 304 Not Modified responses.
 * These are stripped to comply with the HTTP spec.
 */
export const FORBIDDEN_304_HEADERS = [
    HttpHeader.CONTENT_TYPE,
    HttpHeader.CONTENT_LENGTH,
    HttpHeader.CONTENT_RANGE,
    HttpHeader.CONTENT_ENCODING,
    HttpHeader.CONTENT_LANGUAGE,
    HttpHeader.CONTENT_DISPOSITION,
    HttpHeader.CONTENT_MD5,
];

/**
 * Headers that should not be sent in 204 No Content responses.
 * Stripping them is recommended but optional per spec.
 */
export const FORBIDDEN_204_HEADERS = [HttpHeader.CONTENT_LENGTH, HttpHeader.CONTENT_RANGE];
