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

import { HttpHeader, mergeHeader, Method, setHeader } from "./common";

/**
 * Provides information about the CORS policy for the current request.
 */
export interface CorsProvider {
    /** Returns a list of allowed origins. */
    getAllowOrigins(): string[];

    /** Returns true if any origin is allowed (`*`). */
    allowAnyOrigin(): boolean;

    /** Returns the HTTP methods allowed by CORS. */
    getAllowMethods(): Method[];

    /** Returns the HTTP headers allowed by CORS. */
    getAllowHeaders(): string[];

    /** Returns the HTTP headers that should be exposed to the browser. */
    getExposeHeaders(): string[];

    /** Returns the max age (in seconds) for CORS preflight caching. */
    getMaxAge(): number;
}

/**
 * Constants for common CORS headers.
 */
export namespace Cors {
    export const ALLOW_ORIGIN = "Access-Control-Allow-Origin";
    export const ALLOW_CREDENTIALS = "Access-Control-Allow-Credentials";
    export const EXPOSE_HEADERS = "Access-Control-Expose-Headers";
    export const ALLOW_HEADERS = "Access-Control-Allow-Headers";
    export const ALLOW_METHODS = "Access-Control-Allow-Methods";
    export const MAX_AGE = "Access-Control-Max-Age";
    export const ALLOW_ALL_ORIGINS = "*";
}

/**
 * Adds or updates CORS headers on a Headers object according to the provided policy.
 *
 * Behavior:
 * - Removes any existing CORS headers to avoid stale values.
 * - If the request has no origin, the function exits early.
 * - If wildcard `*` is allowed, sets Access-Control-Allow-Origin to `*`.
 * - If the origin is explicitly allowed, sets the correct headers including credentials and Vary: Origin.
 * - Optional headers (Expose-Headers, Allow-Headers, Allow-Methods, Max-Age) are always applied.
 *
 * @param cors The CorsProvider instance that determines allowed origins and headers
 * @param headers The Headers object to update
 */
export function addCorsHeaders(origin: string | null, cors: CorsProvider, headers: Headers): void {
    deleteCorsHeaders(headers);

    // CORS is not required.
    if (!origin || origin.trim() === "") return;

    if (cors.allowAnyOrigin()) {
        setHeader(headers, Cors.ALLOW_ORIGIN, Cors.ALLOW_ALL_ORIGINS);
    } else if (cors.getAllowOrigins().includes(origin)) {
        setHeader(headers, Cors.ALLOW_ORIGIN, origin);
        setHeader(headers, Cors.ALLOW_CREDENTIALS, "true");
        mergeHeader(headers, HttpHeader.VARY, HttpHeader.ORIGIN);
    }

    // Optional headers always applied if CORS.
    mergeHeader(headers, Cors.EXPOSE_HEADERS, cors.getExposeHeaders());
    setHeader(headers, Cors.ALLOW_HEADERS, cors.getAllowHeaders());
    setHeader(headers, Cors.ALLOW_METHODS, cors.getAllowMethods());
    setHeader(headers, Cors.MAX_AGE, String(cors.getMaxAge()));
}

/**
 * Deletes all standard CORS headers from the given Headers object.
 * Useful for cleaning cached responses or resetting headers before reapplying CORS.
 *
 * @param headers The Headers object to clean
 */
function deleteCorsHeaders(headers: Headers) {
    headers.delete(Cors.ALLOW_ORIGIN);
    headers.delete(Cors.ALLOW_CREDENTIALS);
    headers.delete(Cors.EXPOSE_HEADERS);
    headers.delete(Cors.ALLOW_HEADERS);
    headers.delete(Cors.ALLOW_METHODS);
    headers.delete(Cors.MAX_AGE);
}
