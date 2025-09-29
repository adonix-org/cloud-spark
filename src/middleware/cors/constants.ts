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

import { StatusCodes } from "../../constants";
import { HttpHeader } from "../../constants/headers";
import { GET, HEAD, Method, OPTIONS } from "../../constants/methods";
import { Time } from "../../constants/time";
import { CorsConfig } from "../../interfaces/cors";

export const ALLOW_ALL_ORIGINS = "*";

/**
 * Set of HTTP methods considered "simple" under the `CORS` specification.
 *
 * Simple methods do not trigger a preflight request on their own.
 * (Other factors like headers can still cause a preflight.)
 */
export const SIMPLE_METHODS = new Set<Method>([GET, HEAD, OPTIONS]);

/**
 * Status codes for which `CORS` should be skipped.
 *
 * Skips `CORS` for:
 * - 101 Switching Protocols (WebSocket upgrade)
 * - 100 Continue
 * - 3xx Redirects (`CORS` is applied to the final URL only)
 */
export const SKIP_CORS_STATUSES = [
    StatusCodes.SWITCHING_PROTOCOLS,
    StatusCodes.CONTINUE,
    StatusCodes.PROCESSING,
    StatusCodes.EARLY_HINTS,
    StatusCodes.MOVED_PERMANENTLY,
    StatusCodes.MOVED_TEMPORARILY,
    StatusCodes.SEE_OTHER,
    StatusCodes.TEMPORARY_REDIRECT,
    StatusCodes.PERMANENT_REDIRECT,
];

/**
 * Default configuration for`CORS`middleware.
 */
export const defaultCorsConfig: CorsConfig = {
    allowedOrigins: [ALLOW_ALL_ORIGINS],
    allowedHeaders: [HttpHeader.CONTENT_TYPE],
    exposedHeaders: [],
    allowCredentials: false,
    maxAge: 5 * Time.Minute,
} as const;
