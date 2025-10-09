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
export namespace HttpHeader {
    export const ACCEPT = "accept";
    export const ACCEPT_ENCODING = "accept-encoding";
    export const ACCEPT_LANGUAGE = "accept-language";
    export const ACCEPT_RANGES = "accept-ranges";
    export const ALLOW = "allow";
    export const AUTHORIZATION = "authorization";
    export const CACHE_CONTROL = "cache-control";
    export const CONNECTION = "connection";
    export const CONTENT_DISPOSITION = "content-disposition";
    export const CONTENT_ENCODING = "content-encoding";
    export const CONTENT_LANGUAGE = "content-language";
    export const CONTENT_LENGTH = "content-length";
    export const CONTENT_RANGE = "content-range";
    export const CONTENT_TYPE = "content-type";
    export const CONTENT_MD5 = "content-md5";
    export const COOKIE = "cookie";
    export const ETAG = "etag";
    export const IF_MATCH = "if-match";
    export const IF_MODIFIED_SINCE = "if-modified-since";
    export const IF_NONE_MATCH = "if-none-match";
    export const IF_UNMODIFIED_SINCE = "if-unmodified-since";
    export const LAST_MODIFIED = "last-modified";
    export const ORIGIN = "origin";
    export const RANGE = "range";
    export const SET_COOKIE = "set-cookie";
    export const VARY = "vary";

    // Cors Headers
    export const ACCESS_CONTROL_ALLOW_CREDENTIALS = "access-control-allow-credentials";
    export const ACCESS_CONTROL_ALLOW_HEADERS = "access-control-allow-headers";
    export const ACCESS_CONTROL_ALLOW_METHODS = "access-control-allow-methods";
    export const ACCESS_CONTROL_ALLOW_ORIGIN = "access-control-allow-origin";
    export const ACCESS_CONTROL_EXPOSE_HEADERS = "access-control-expose-headers";
    export const ACCESS_CONTROL_MAX_AGE = "access-control-max-age";

    // Websocket Headers
    export const SEC_WEBSOCKET_VERSION = "sec-websocket-version";
    export const UPGRADE = "upgrade";

    // Internal Headers
    export const INTERNAL_VARIANT_SET = "internal-variant-set";
}

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
