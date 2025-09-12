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
 */ import { HttpHeader } from "../../constants/http";
import { CorsConfig } from "../../interfaces/cors-config";
import { Worker } from "../../interfaces/worker";
import { ClonedResponse, Options } from "../../responses";
import { mergeHeader, setHeader } from "../../utils/header";
import { getOrigin } from "../../utils/request";

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

    setAllowOrigin(options.headers, cors, origin);
    setAllowCredentials(options.headers, cors, origin);
    setAllowMethods(options.headers, worker);
    setMaxAge(options.headers, cors);
    setAllowHeaders(options.headers, worker, cors);

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
    setAllowOrigin(clone.headers, cors, origin);
    setAllowCredentials(clone.headers, cors, origin);
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
export function setAllowOrigin(headers: Headers, cors: CorsConfig, origin: string | null): void {
    if (!origin) return;

    if (allowAnyOrigin(cors)) {
        setHeader(headers, HttpHeader.ACCESS_CONTROL_ALLOW_ORIGIN, HttpHeader.ALLOW_ALL_ORIGINS);
    } else {
        if (cors.allowedOrigins.includes(origin)) {
            setHeader(headers, HttpHeader.ACCESS_CONTROL_ALLOW_ORIGIN, origin);
        }
        mergeHeader(headers, HttpHeader.VARY, HttpHeader.ORIGIN);
    }
}

/**
 * Sets the Access-Control-Allow-Credentials header if credentials
 * are allowed and the origin is not '*'.
 *
 * @param headers - The headers object to modify.
 * @param cors - The CORS configuration.
 * @param origin - The request's origin, or null if not present.
 */
export function setAllowCredentials(headers: Headers, cors: CorsConfig, origin: string | null): void {
    if (!origin) return;

    if (!allowAnyOrigin(cors) && cors.allowCredentials) {
        setHeader(headers, HttpHeader.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true");
    }
}

/**
 * Sets the Access-Control-Allow-Methods header based on the Worker's
 * allowed methods.
 *
 * @param headers - The headers object to modify.
 * @param worker - The Worker handling the request.
 */
export function setAllowMethods(headers: Headers, worker: Worker): void {
    setHeader(headers, HttpHeader.ACCESS_CONTROL_ALLOW_METHODS, worker.getAllowedMethods());
}

/**
 * Sets the Access-Control-Max-Age header based on the CORS config.
 *
 * @param headers - The headers object to modify.
 * @param cors - The CORS configuration.
 */
export function setMaxAge(headers: Headers, cors: CorsConfig): void {
    setHeader(headers, HttpHeader.ACCESS_CONTROL_MAX_AGE, String(cors.maxAge));
}

/**
 * Sets the Access-Control-Allow-Headers header.
 *
 * If allowedHeaders are explicitly set in the CORS config, those are used.
 * Otherwise, the headers requested by the client are echoed back.
 *
 * @param headers - The headers object to modify.
 * @param worker - The Worker handling the request.
 * @param cors - The CORS configuration.
 */
export function setAllowHeaders(headers: Headers, worker: Worker, cors: CorsConfig): void {
    if (cors.allowedHeaders.length > 0) {
        setHeader(headers, HttpHeader.ACCESS_CONTROL_ALLOW_HEADERS, cors.allowedHeaders);
        return;
    }
    const requestHeaders = worker.request.headers.get(HttpHeader.ACCESS_CONTROL_REQUEST_HEADERS);
    if (requestHeaders) {
        setHeader(headers, HttpHeader.ACCESS_CONTROL_ALLOW_HEADERS, requestHeaders);
        mergeHeader(headers, HttpHeader.VARY, HttpHeader.ACCESS_CONTROL_ALLOW_HEADERS);
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
export function allowAnyOrigin(cors: CorsConfig): boolean {
    return cors.allowedOrigins.includes("*");
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
