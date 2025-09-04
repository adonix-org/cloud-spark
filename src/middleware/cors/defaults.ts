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

import { Time } from "../../common";
import { CorsConfig } from "../../interfaces/cors-config";

/**
 * Default configuration for CORS middleware.
 *
 * Provides a baseline set of CORS rules applied when no custom configuration
 * is supplied to the middleware. This allows all origins (`*`), permits
 * the `Content-Type` header, exposes no additional headers, and caches
 * preflight requests for 1 week by default.
 *
 * You can override any of these defaults by passing a custom `CorsConfig`
 * to the CORS middleware constructor.
 */
export const defaultCorsConfig: CorsConfig = {
    allowedOrigins: ["*"], // Origins allowed for CORS requests
    allowedHeaders: ["Content-Type"], // HTTP headers allowed in requests
    exposedHeaders: [], // Headers exposed to the client
    maxAge: Time.Week, // Max age in seconds for preflight caching
} as const;
