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

import { HttpHeader } from "../../constants/http";
import { Time } from "../../constants/time";
import { CorsConfig } from "../../interfaces/cors-config";

/**
 * Default configuration for CORS middleware.
 */
export const defaultCorsConfig: CorsConfig = {
    /**
     * By default, allow all origins.
     * Note: This must be overridden if you also enable `allowCredentials`.
     */
    allowedOrigins: ["*"],

    /**
     * Default to allowing only "Content-Type".
     * This permits requests with JSON or form bodies, while blocking
     * arbitrary custom headers unless explicitly added.
     */
    allowedHeaders: [HttpHeader.CONTENT_TYPE],

    /**
     * No response headers are exposed by default.
     * Client-side code will only be able to read CORS-safelisted headers
     * (e.g. Cache-Control, Content-Type, Expires, Last-Modified, Pragma).
     */
    exposedHeaders: [],

    /**
     * Credentials (cookies, HTTP auth) are disallowed by default.
     * This avoids the spec restriction that forbids using "*" for origins
     * when credentials are enabled.
     */
    allowCredentials: false,

    /**
     * Default preflight cache duration: 1 week.
     * Browsers may cache OPTIONS responses for up to this many seconds.
     * Adjust lower if your CORS rules may change frequently.
     */
    maxAge: Time.Week,
} as const;
