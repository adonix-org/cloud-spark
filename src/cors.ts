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

import { getOrigin, mergeHeader, setHeader, Time } from "./common";
import { Worker } from "./worker";

/**
 * Default CORS configuration used by `CorsProvider`.
 */
export const DEFAULT_CORS_CONFIG: Required<CorsConfig> = {
    /** Origins allowed by default. Default: all (`*`). */
    allowedOrigins: ["*"],

    /** Allowed headers for CORS requests. Default: `Content-Type`. */
    allowedHeaders: ["Content-Type"],

    /** Headers exposed to the client. Default: none. */
    exposedHeaders: [],

    /** Max age (in seconds) for preflight caching. Default: 1 week. */
    maxAge: Time.Week,
} as const;

/**
 * Configuration options for `CorsProvider`.
 */
export interface CorsConfig {
    /** Origins allowed for CORS requests. Optional; defaults to `["*"]`. */
    allowedOrigins?: string[];

    /** Allowed HTTP headers for CORS requests. Optional; defaults to `["Content-Type"]`. */
    allowedHeaders?: string[];

    /** HTTP headers exposed to the client. Optional; defaults to `[]`. */
    exposedHeaders?: string[];

    /** Max age in seconds for CORS preflight caching. Optional; defaults to 1 week. */
    maxAge?: number;
}

/**
 * Provides CORS settings for a worker.
 *
 * Combines a user-supplied `CorsConfig` with defaults. Used by
 * `CorsHandler` to automatically set the appropriate headers.
 */
export class CorsProvider {
    private readonly config: Required<CorsConfig>;

    /**
     * Create a new `CorsProvider`.
     *
     * @param config - Optional configuration to override defaults.
     */
    constructor(config: CorsConfig = {}) {
        this.config = { ...DEFAULT_CORS_CONFIG, ...config };
    }

    /** Returns the allowed origins. Default: all (`*`). */
    public getAllowedOrigins(): string[] {
        return this.config.allowedOrigins;
    }

    /** Returns the allowed HTTP headers. Default: `["Content-Type"]`. */
    public getAllowedHeaders(): string[] {
        return this.config.allowedHeaders;
    }

    /** Returns headers exposed to the client. Default: `[]`. */
    public getExposedHeaders(): string[] {
        return this.config.exposedHeaders;
    }

    /** Returns the max age in seconds for preflight requests. Default: 1 week. */
    public getMaxAge(): number {
        return this.config.maxAge;
    }
}

/**
 * Constants for common CORS headers.
 */
export namespace Cors {
    export const MAX_AGE = "Access-Control-Max-Age";
    export const ALLOW_ORIGIN = "Access-Control-Allow-Origin";
    export const ALLOW_HEADERS = "Access-Control-Allow-Headers";
    export const ALLOW_METHODS = "Access-Control-Allow-Methods";
    export const EXPOSE_HEADERS = "Access-Control-Expose-Headers";
    export const ALLOW_CREDENTIALS = "Access-Control-Allow-Credentials";
    export const ALLOW_ALL_ORIGINS = "*";
}

/**
 * Adds or updates CORS headers on a Headers object according to the provided policy.
 *
 * Behavior:
 * - Removes any existing CORS headers to avoid stale values.
 * - If the request has no origin, the function exits early.
 * - If wildcard `*` is allowed, sets Access-Control-Allow-Origin to `*`.
 * - If the origin is explicitly allowed, sets the correct headers including credentials.
 * - Optional headers (Expose-Headers, Allow-Headers, Allow-Methods, Max-Age) are always applied.
 *
 * @param cors The CorsProvider instance that determines allowed origins and headers
 * @param headers The Headers object to update
 */
export function addCorsHeaders(worker: Worker, cors: CorsProvider, headers: Headers): void {
    deleteCorsHeaders(headers);

    const origin = getOrigin(worker.request);

    // CORS is not required.
    if (!origin || origin.trim() === "") return;

    if (allowAnyOrigin(cors)) {
        setHeader(headers, Cors.ALLOW_ORIGIN, Cors.ALLOW_ALL_ORIGINS);
    } else if (cors.getAllowedOrigins().includes(origin)) {
        setHeader(headers, Cors.ALLOW_ORIGIN, origin);
        setHeader(headers, Cors.ALLOW_CREDENTIALS, "true");
    }

    // Optional headers always applied if CORS.
    setHeader(headers, Cors.MAX_AGE, String(cors.getMaxAge()));
    setHeader(headers, Cors.ALLOW_METHODS, worker.getAllowedMethods());
    setHeader(headers, Cors.ALLOW_HEADERS, cors.getAllowedHeaders());
    mergeHeader(headers, Cors.EXPOSE_HEADERS, cors.getExposedHeaders());
}

/**
 * Determines if a CORS policy allows any origin (`*`).
 *
 * @param cors - The `CorsProvider` instance to check.
 * @returns `true` if the allowed origins include `"*"`, otherwise `false`.
 */
export function allowAnyOrigin(cors: CorsProvider): boolean {
    return cors.getAllowedOrigins().includes("*");
}

/**
 * Deletes all standard CORS headers from the given Headers object.
 * Useful for cleaning cached responses or resetting headers before reapplying CORS.
 *
 * @param headers The Headers object to clean
 */
function deleteCorsHeaders(headers: Headers) {
    headers.delete(Cors.MAX_AGE);
    headers.delete(Cors.ALLOW_ORIGIN);
    headers.delete(Cors.ALLOW_HEADERS);
    headers.delete(Cors.ALLOW_METHODS);
    headers.delete(Cors.EXPOSE_HEADERS);
    headers.delete(Cors.ALLOW_CREDENTIALS);
}
