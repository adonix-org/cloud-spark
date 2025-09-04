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

import { Time } from "./common";

/**
 * Default CORS configuration used by `CorsProvider`.
 *
 * By default, all origins are allowed, only `Content-Type` is allowed as a header,
 * no headers are exposed, and preflight caching is 1 week.
 *
 * @see {@link CorsConfig}
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
 *
 * @see {@link DEFAULT_CORS_CONFIG}
 */
export interface CorsConfig {
    /** Origins allowed for CORS requests. */
    allowedOrigins?: string[];

    /** Allowed HTTP headers for CORS requests. */
    allowedHeaders?: string[];

    /** HTTP headers exposed to the client. */
    exposedHeaders?: string[];

    /** Max age in seconds for CORS preflight caching. */
    maxAge?: number;
}
