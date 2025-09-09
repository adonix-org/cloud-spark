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

import { getOrigin, HttpHeader, mergeHeader, setHeader } from "../../common";
import { CorsConfig } from "../../interfaces/cors-config";
import { Worker } from "../../interfaces/worker";
import { OPTIONS } from "./constants";

/**
 * Adds CORS headers to the given Headers object based on the request and config.
 */
export function addCorsHeaders(worker: Worker, cors: CorsConfig, headers: Headers): void {
    deleteCorsHeaders(headers);

    const origin = getOrigin(worker.request);
    if (!origin || !isCors(worker.request)) return;

    if (allowAnyOrigin(cors)) {
        // Allowed Origin: *
        setHeader(headers, HttpHeader.ALLOW_ORIGIN, HttpHeader.ALLOW_ALL_ORIGINS);
    } else {
        // Allowed Origin: "https://example.com"
        // Always add Vary: Origin
        mergeHeader(headers, HttpHeader.VARY, HttpHeader.ORIGIN);

        if (cors.allowedOrigins.includes(origin)) {
            // When the provided origin is allowed:
            setHeader(headers, HttpHeader.ALLOW_ORIGIN, origin);
            setHeader(headers, HttpHeader.ALLOW_CREDENTIALS, "true");
        }
    }

    // Add for all CORS requests.
    setHeader(headers, HttpHeader.MAX_AGE, String(cors.maxAge));
    setHeader(headers, HttpHeader.ALLOW_HEADERS, cors.allowedHeaders);
    mergeHeader(headers, HttpHeader.ALLOW_METHODS, [...worker.getAllowedMethods(), OPTIONS]);
    mergeHeader(headers, HttpHeader.EXPOSE_HEADERS, cors.exposedHeaders);
}

/** Returns true if the CORS config allows all origins (`*`). */
export function allowAnyOrigin(cors: CorsConfig): boolean {
    return cors.allowedOrigins.includes("*");
}

/**
 * Determines whether a given request is a cross-origin request that requires CORS headers.
 *
 * @param request - The incoming Request object.
 * @returns `true` if the request is cross-origin and should have CORS headers, `false` otherwise.
 */
function isCors(request: Request): boolean {
    const site = request.headers.get(HttpHeader.SEC_FETCH_SITE);
    return site === HttpHeader.CROSS_SITE;
}

/** Removes all standard CORS headers from a Headers object. */
function deleteCorsHeaders(headers: Headers): void {
    headers.delete(HttpHeader.MAX_AGE);
    headers.delete(HttpHeader.ALLOW_ORIGIN);
    headers.delete(HttpHeader.ALLOW_HEADERS);
    headers.delete(HttpHeader.ALLOW_METHODS);
    headers.delete(HttpHeader.EXPOSE_HEADERS);
    headers.delete(HttpHeader.ALLOW_CREDENTIALS);
}
