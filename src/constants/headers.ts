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
    export const ACCEPT_ENCODING = "Accept-Encoding";
    export const ACCEPT_RANGES = "Accept-Ranges";
    export const ALLOW = "Allow";
    export const CACHE_CONTROL = "Cache-Control";
    export const CONTENT_DISPOSITION = "Content-Disposition";
    export const CONTENT_ENCODING = "Content-Encoding";
    export const CONTENT_LANGUAGE = "Content-Language";
    export const CONTENT_LENGTH = "Content-Length";
    export const CONTENT_RANGE = "Content-Range";
    export const CONTENT_TYPE = "Content-Type";
    export const CONTENT_MD5 = "Content-MD5";
    export const ETAG = "ETag";
    export const ORIGIN = "Origin";
    export const VARY = "Vary";

    // Cors Headers
    export const ACCESS_CONTROL_ALLOW_CREDENTIALS = "Access-Control-Allow-Credentials";
    export const ACCESS_CONTROL_ALLOW_HEADERS = "Access-Control-Allow-Headers";
    export const ACCESS_CONTROL_ALLOW_METHODS = "Access-Control-Allow-Methods";
    export const ACCESS_CONTROL_ALLOW_ORIGIN = "Access-Control-Allow-Origin";
    export const ACCESS_CONTROL_EXPOSE_HEADERS = "Access-Control-Expose-Headers";
    export const ACCESS_CONTROL_MAX_AGE = "Access-Control-Max-Age";

    // Websocket Headers
    export const SEC_WEBSOCKET_VERSION = "Sec-WebSocket-Version";
    export const CONNECTION = "Connection";
    export const UPGRADE = "Upgrade";
}

/** Headers forbidden in 304 responses */
export const FORBIDDEN_ENTITY_HEADERS = new Set([
    HttpHeader.CONTENT_TYPE,
    HttpHeader.CONTENT_LENGTH,
    HttpHeader.CONTENT_RANGE,
    HttpHeader.CONTENT_ENCODING,
    HttpHeader.CONTENT_LANGUAGE,
    HttpHeader.CONTENT_DISPOSITION,
    HttpHeader.CONTENT_MD5,
]);
