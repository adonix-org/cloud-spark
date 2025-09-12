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
 * Override only what is needed from the default CORS configuration.
 */
export type CorsInit = Partial<CorsConfig>;

/**
 * Configuration options for Cross-Origin Resource Sharing (CORS).
 *
 * Implementations of CORS middleware use this interface to determine
 * how cross-origin requests are validated and which headers are sent
 * in the response.
 */
export interface CorsConfig {
    /**
     * Origins allowed for CORS requests.
     *
     * Use `["*"]` to allow all origins, or provide a list of specific origins.
     * Example: `["https://example.com", "https://api.example.com"]`
     */
    allowedOrigins: string[];

    /**
     * HTTP headers allowed in CORS requests.
     *
     * Requests that include headers not listed here will be blocked
     * during the preflight check.
     */
    allowedHeaders: string[];

    /**
     * HTTP headers exposed to the client.
     *
     * By default, most headers are not accessible from client-side JavaScript.
     * Use this option to explicitly allow certain response headers to be read.
     */
    exposedHeaders: string[];

    /**
     * Whether the resource supports user credentials (cookies, HTTP authentication).
     *
     * Defaults to false.
     *
     * If true, the Access-Control-Allow-Origin response header must not be "*".
     */
    allowCredentials: boolean;

    /**
     * Maximum age (in seconds) that the results of a preflight request
     * can be cached by the client.
     *
     * Example: `60 * 60 * 24 * 7` (1 week).
     */
    maxAge: number;
}
