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

export interface CorsProvider {
    getOrigin(): string | null;
    getAllowOrigins(): string[];
    allowAnyOrigin(): boolean;
    getAllowMethods(): Method[];
    getAllowHeaders(): string[];
    getExposeHeaders(): string[];
    getMaxAge(): number;
}

export namespace Cors {
    export const ALLOW_ORIGIN = "Access-Control-Allow-Origin";
    export const ALLOW_CREDENTIALS = "Access-Control-Allow-Credentials";
    export const EXPOSE_HEADERS = "Access-Control-Expose-Headers";
    export const ALLOW_HEADERS = "Access-Control-Allow-Headers";
    export const ALLOW_METHODS = "Access-Control-Allow-Methods";
    export const MAX_AGE = "Access-Control-Max-Age";
    export const ALLOW_ALL_ORIGINS = "*";
}

export function addCorsHeaders(cors: CorsProvider, headers: Headers): void {
    // Remove stale headers if from cache
    deleteCorsHeaders(headers);

    const origin = cors.getOrigin();
    if (!origin) return;

    if (cors.allowAnyOrigin()) {
        setHeader(headers, Cors.ALLOW_ORIGIN, Cors.ALLOW_ALL_ORIGINS);
    } else if (cors.getAllowOrigins().includes(origin)) {
        setHeader(headers, Cors.ALLOW_ORIGIN, origin);
        setHeader(headers, Cors.ALLOW_CREDENTIALS, "true");
        mergeHeader(headers, HttpHeader.VARY, HttpHeader.ORIGIN);
    }

    // Optional headers always applied
    mergeHeader(headers, Cors.EXPOSE_HEADERS, cors.getExposeHeaders());
    setHeader(headers, Cors.ALLOW_HEADERS, cors.getAllowHeaders());
    setHeader(headers, Cors.ALLOW_METHODS, cors.getAllowMethods());
    setHeader(headers, Cors.MAX_AGE, String(cors.getMaxAge()));
}

export function deleteCorsHeaders(headers: Headers) {
    headers.delete(Cors.ALLOW_ORIGIN);
    headers.delete(Cors.ALLOW_CREDENTIALS);
    headers.delete(Cors.EXPOSE_HEADERS);
    headers.delete(Cors.ALLOW_METHODS);
    headers.delete(Cors.MAX_AGE);
}

/**
 * Immutable-friendly helper: returns a new Response with updated CORS headers.
 * Useful if you want to avoid mutating a cached response in place.
 */
export function withCorsHeaders(cors: CorsProvider, res: Response): Response {
    const headers = new Headers(res.headers);
    addCorsHeaders(cors, headers);
    return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers,
    });
}

export function withoutCorsHeaders(res: Response): Response {
    const headers = new Headers(res.headers);
    deleteCorsHeaders(headers);
    return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers,
    });
}
