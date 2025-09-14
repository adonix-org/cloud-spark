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

import { HttpHeader, Method, GET, HEAD, OPTIONS } from "../../constants/http";
import { assertMethods } from "../../guards/methods";
import { CorsConfig } from "../../interfaces/cors-config";
import { Worker } from "../../interfaces/worker";
import { ClonedResponse, Options } from "../../responses";
import { mergeHeader, setHeader } from "../../utils/header";
import { getOrigin } from "../../utils/request";
import { ALLOW_ALL_ORIGINS } from "./constants";

/**
 * Set of HTTP methods considered "simple" under the CORS specification.
 *
 * Simple methods do not trigger a preflight request:
 * - GET
 * - HEAD
 * - OPTIONS
 */
const SIMPLE_METHODS = new Set<Method>([GET, HEAD, OPTIONS]);

/**
 * Handles a CORS preflight OPTIONS request.
 *
 * Sets the appropriate CORS headers based on the provided configuration
 * and the origin of the request.
 *
 * @param worker - The Worker handling the request.
 * @param cors - The CORS configuration.
 * @returns A Response object for the preflight request.
 */
export async function options(worker: Worker, cors: CorsConfig): Promise<Response> {
    const options = new Options();
    const origin = getOrigin(worker.request);

    if (origin) {
        setAllowOrigin(options.headers, cors, origin);
        setAllowCredentials(options.headers, cors, origin);
    }

    setAllowMethods(options.headers, worker);
    setMaxAge(options.headers, cors);
    setAllowHeaders(options.headers, cors);

    return options.getResponse();
}

/**
 * Applies CORS headers to an existing response.
 *
 * Useful for normal (non-preflight) responses where the response
 * should include CORS headers based on the request origin.
 *
 * @param response - The original Response object.
 * @param worker - The Worker handling the request.
 * @param cors - The CORS configuration.
 * @returns A new Response object with CORS headers applied.
 */
export async function apply(
    response: Response,
    worker: Worker,
    cors: CorsConfig,
): Promise<Response> {
    const clone = new ClonedResponse(response);
    const origin = getOrigin(worker.request);

    deleteCorsHeaders(clone.headers);

    if (origin) {
        setAllowOrigin(clone.headers, cors, origin);
        setAllowCredentials(clone.headers, cors, origin);
    }

    setExposedHeaders(clone.headers, cors);

    return clone.getResponse();
}

/**
 * Sets the Access-Control-Allow-Origin header based on the CORS config
 * and request origin.
 *
 * @param headers - The headers object to modify.
 * @param cors - The CORS configuration.
 * @param origin - The request's origin, or null if not present.
 */
export function setAllowOrigin(headers: Headers, cors: CorsConfig, origin: string): void {
    if (allowAllOrigins(cors)) {
        setHeader(headers, HttpHeader.ACCESS_CONTROL_ALLOW_ORIGIN, ALLOW_ALL_ORIGINS);
    } else {
        if (cors.allowedOrigins.includes(origin)) {
            setHeader(headers, HttpHeader.ACCESS_CONTROL_ALLOW_ORIGIN, origin);
        }
        mergeHeader(headers, HttpHeader.VARY, HttpHeader.ORIGIN);
    }
}

/**
 * Conditionally sets the `Access-Control-Allow-Credentials` header
 * for a CORS response.
 *
 * This header is only set if:
 * 1. `cors.allowCredentials` is true,
 * 2. The configuration does **not** allow any origin (`*`), and
 * 3. The provided `origin` is explicitly listed in `cors.allowedOrigins`.
 *
 * @param headers - The Headers object to modify.
 * @param cors - The CORS configuration.
 * @param origin - The origin of the incoming request.
 */
export function setAllowCredentials(headers: Headers, cors: CorsConfig, origin: string): void {
    if (!cors.allowCredentials) return;
    if (allowAllOrigins(cors)) return;
    if (!cors.allowedOrigins.includes(origin)) return;

    setHeader(headers, HttpHeader.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true");
}

/**
 * Sets the `Access-Control-Allow-Methods` header for a CORS response,
 * but only for non-simple methods.
 *
 * Simple methods (GET, HEAD, OPTIONS) are automatically allowed by the
 * CORS spec, so this function only adds methods beyond those.
 *
 * @param headers - The Headers object to modify.
 * @param worker - The Worker instance used to retrieve allowed methods.
 */
export function setAllowMethods(headers: Headers, worker: Worker): void {
    const methods = worker.getAllowedMethods();
    assertMethods(methods);

    const allowed = methods.filter((method) => !SIMPLE_METHODS.has(method));

    if (allowed.length > 0) {
        setHeader(headers, HttpHeader.ACCESS_CONTROL_ALLOW_METHODS, allowed);
    }
}

/**
 * Sets the `Access-Control-Max-Age` header for a CORS response.
 *
 * This header indicates how long the results of a preflight request
 * can be cached by the client (in seconds).
 *
 * The value is **clamped to a non-negative integer** to comply with
 * the CORS specification:
 * - Decimal values are floored to the nearest integer.
 * - Negative values are treated as `0`.
 *
 * @param headers - The Headers object to modify.
 * @param cors - The CORS configuration containing the `maxAge` value in seconds.
 */
export function setMaxAge(headers: Headers, cors: CorsConfig): void {
    const maxAge = Math.max(0, Math.floor(cors.maxAge));
    setHeader(headers, HttpHeader.ACCESS_CONTROL_MAX_AGE, String(maxAge));
}

/**
 * Sets the Access-Control-Allow-Headers header based on the CORS configuration.
 *
 * Only the headers explicitly listed in `cors.allowedHeaders` are sent.
 * If the array is empty, no Access-Control-Allow-Headers header is added.
 *
 * @param headers - The Headers object to modify.
 * @param cors - The CORS configuration.
 */
export function setAllowHeaders(headers: Headers, cors: CorsConfig): void {
    if (cors.allowedHeaders.length > 0) {
        setHeader(headers, HttpHeader.ACCESS_CONTROL_ALLOW_HEADERS, cors.allowedHeaders);
    }
}

/**
 * Sets the Access-Control-Expose-Headers header for a response.
 *
 * @param headers - The headers object to modify.
 * @param cors - The CORS configuration.
 */
export function setExposedHeaders(headers: Headers, cors: CorsConfig): void {
    setHeader(headers, HttpHeader.ACCESS_CONTROL_EXPOSE_HEADERS, cors.exposedHeaders);
}

/**
 * Returns true if the CORS config allows all origins ('*').
 *
 * @param cors - The CORS configuration.
 */
export function allowAllOrigins(cors: CorsConfig): boolean {
    return cors.allowedOrigins.includes(ALLOW_ALL_ORIGINS);
}

/**
 * Deletes any existing CORS headers from the provided headers object.
 *
 * @param headers - The headers object to modify.
 */
export function deleteCorsHeaders(headers: Headers): void {
    headers.delete(HttpHeader.ACCESS_CONTROL_MAX_AGE);
    headers.delete(HttpHeader.ACCESS_CONTROL_ALLOW_ORIGIN);
    headers.delete(HttpHeader.ACCESS_CONTROL_ALLOW_HEADERS);
    headers.delete(HttpHeader.ACCESS_CONTROL_ALLOW_METHODS);
    headers.delete(HttpHeader.ACCESS_CONTROL_EXPOSE_HEADERS);
    headers.delete(HttpHeader.ACCESS_CONTROL_ALLOW_CREDENTIALS);
}
