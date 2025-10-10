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
 * User-supplied options for configuring `CORS` behavior.
 *
 * This is a partial form of {@link CorsConfig}, meaning you only need
 * to provide the options you want to override. Any missing values will
 * fall back to the {@link defaultCorsConfig}.
 *
 * Example:
 * ```ts
 * const cors: CorsInit = {
 *   allowedOrigins: ["https://example.com"],
 *   allowCredentials: true,
 * };
 * ```
 */
export type CorsInit = Partial<CorsConfig>;

/**
 * Configuration options for Cross-Origin Resource Sharing `CORS`.
 *
 * Implementations of `CORS` middleware use this interface to determine
 * how cross-origin requests are validated and which headers are sent
 * in the response.
 *
 * @default
 * ```ts
 * {
 *   allowedOrigins: ["*"],
 *   allowedHeaders: ["Content-Type"],
 *   exposedHeaders: [],
 *   allowCredentials: false,
 *   maxAge: 300, // 5 minutes
 * }
 * ```
 */
export interface CorsConfig {
    /**
     * Origins allowed for `CORS` requests.
     *
     * Use `["*"]` to allow all origins, or provide a list of specific origins.
     * Example: `["https://example.com", "https://api.example.com"]`
     *
     * @default ["*"]
     */
    allowedOrigins: string[];

    /**
     * HTTP headers allowed in `CORS` requests.
     *
     * Browsers always allow `CORS`-safelisted request headers* without preflight:
     * - `Accept`
     * - `Accept-Language`
     * - `Content-Language`
     * - `Content-Type` (but only if its value is `application/x-www-form-urlencoded`,
     *   `multipart/form-data`, or `text/plain`)
     *
     * Because `Content-Type` is only partially safelisted, it is included in the
     * default allowed headers.
     *
     * Add custom headers here (e.g., `Authorization`) if your clients send them.
     *
     * @default ["Content-Type"]
     */
    allowedHeaders: string[];

    /**
     * HTTP headers exposed to the client.
     *
     * By default, most headers are not accessible from client-side JavaScript.
     * Use this option to explicitly allow certain response headers to be read.
     *
     * @default []
     */
    exposedHeaders: string[];

    /**
     * Whether the resource supports user credentials (cookies, HTTP authentication).
     *
     * If true, the Access-Control-Allow-Origin response header must not be "*".
     *
     * @default false
     */
    allowCredentials: boolean;

    /**
     * Maximum age (in seconds) that the results of a preflight request
     * can be cached by the client.
     *
     * Increase for production use to reduce preflights, or lower for development
     * if you frequently adjust `CORS` rules.
     *
     * @default 300 (5 minutes)
     */
    maxAge: number;
}
