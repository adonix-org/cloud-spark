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
import { CorsConfig } from "./config";
import { Worker } from "../../workers/worker";

export function addCorsHeaders(worker: Worker, cors: CorsConfig, headers: Headers): void {
    deleteCorsHeaders(headers);

    const origin = getOrigin(worker.request);

    // CORS is not required.
    if (!origin || origin.trim() === "") return;

    if (allowAnyOrigin(cors)) {
        setHeader(headers, HttpHeader.ALLOW_ORIGIN, HttpHeader.ALLOW_ALL_ORIGINS);
    } else if (cors.allowedOrigins.includes(origin)) {
        setHeader(headers, HttpHeader.ALLOW_ORIGIN, origin);
        setHeader(headers, HttpHeader.ALLOW_CREDENTIALS, "true");
    }

    // Optional headers always applied if HttpHeader.
    setHeader(headers, HttpHeader.MAX_AGE, String(cors.maxAge));
    setHeader(headers, HttpHeader.ALLOW_METHODS, worker.getAllowedMethods());
    setHeader(headers, HttpHeader.ALLOW_HEADERS, cors.allowedHeaders);
    mergeHeader(headers, HttpHeader.EXPOSE_HEADERS, cors.exposedHeaders);
}

export function allowAnyOrigin(cors: CorsConfig): boolean {
    return cors.allowedOrigins.includes("*");
}

/**
 * Deletes all standard CORS headers from the given Headers object.
 *
 * @param headers The Headers object to clean
 */
function deleteCorsHeaders(headers: Headers): void {
    headers.delete(HttpHeader.MAX_AGE);
    headers.delete(HttpHeader.ALLOW_ORIGIN);
    headers.delete(HttpHeader.ALLOW_HEADERS);
    headers.delete(HttpHeader.ALLOW_METHODS);
    headers.delete(HttpHeader.EXPOSE_HEADERS);
    headers.delete(HttpHeader.ALLOW_CREDENTIALS);
}
