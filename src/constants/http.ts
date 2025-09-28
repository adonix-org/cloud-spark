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
 * https://github.com/prettymuchbryce/http-status-codes
 */
export { StatusCodes } from "http-status-codes";

/**
 * Standard HTTP header names and common values.
 */
export namespace HttpHeader {
    export const ACCEPT_ENCODING = "Accept-Encoding";
    export const ACCEPT_RANGES = "Accept-Ranges";
    export const ALLOW = "Allow";
    export const CONTENT_LENGTH = "Content-Length";
    export const CONTENT_RANGE = "Content-Range";
    export const CONTENT_TYPE = "Content-Type";
    export const CACHE_CONTROL = "Cache-Control";
    export const ORIGIN = "Origin";
    export const USER_AGENT = "User-Agent";
    export const VARY = "Vary";

    // Security Headers
    export const CONTENT_SECURITY_POLICY = "Content-Security-Policy"; // fine-grained script/style/image restrictions
    export const PERMISSIONS_POLICY = "Permissions-Policy"; // formerly Feature-Policy, controls APIs like geolocation/camera
    export const STRICT_TRANSPORT_SECURITY = "Strict-Transport-Security"; // e.g. "max-age=63072000; includeSubDomains; preload"
    export const REFERRER_POLICY = "Referrer-Policy"; // e.g. "no-referrer", "strict-origin-when-cross-origin"
    export const X_CONTENT_TYPE_OPTIONS = "X-Content-Type-Options"; // usually "nosniff"
    export const X_FRAME_OPTIONS = "X-Frame-Options"; // e.g. "DENY" or "SAMEORIGIN"

    // Cors Headers
    export const ACCESS_CONTROL_ALLOW_CREDENTIALS = "Access-Control-Allow-Credentials";
    export const ACCESS_CONTROL_ALLOW_HEADERS = "Access-Control-Allow-Headers";
    export const ACCESS_CONTROL_ALLOW_METHODS = "Access-Control-Allow-Methods";
    export const ACCESS_CONTROL_ALLOW_ORIGIN = "Access-Control-Allow-Origin";
    export const ACCESS_CONTROL_EXPOSE_HEADERS = "Access-Control-Expose-Headers";
    export const ACCESS_CONTROL_MAX_AGE = "Access-Control-Max-Age";
    export const ACCESS_CONTROL_REQUEST_HEADERS = "Access-Control-Request-Headers";

    // Websocket Headers
    export const SEC_WEBSOCKET_VERSION = "Sec-WebSocket-Version";
    export const CONNECTION = "Connection";
    export const UPGRADE = "Upgrade";
}

/**
 * Standard HTTP request methods.
 */
export enum Method {
    GET = "GET",
    PUT = "PUT",
    HEAD = "HEAD",
    POST = "POST",
    PATCH = "PATCH",
    DELETE = "DELETE",
    OPTIONS = "OPTIONS",
}

/**
 * Shorthand constants for each HTTP method.
 *
 * These are equivalent to the corresponding enum members in `Method`.
 * For example, `GET === Method.GET`.
 */
export const { GET, PUT, HEAD, POST, PATCH, DELETE, OPTIONS } = Method;
