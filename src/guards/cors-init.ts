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

import { CorsInit } from "../interfaces/cors-config";
import { isStringArray } from "./arrays";

/**
 * Throws if the given value is not a valid CorsInit.
 *
 * Checks only the fields that are present, since CorsInit is Partial<CorsConfig>.
 *
 * @param value - The value to check.
 */
export function assertCorsInit(value: any): asserts value is CorsInit {
    if (typeof value !== "object" || value === null) {
        throw new TypeError("CorsInit must be an object.");
    }

    if (value.allowedOrigins !== undefined && !isStringArray(value.allowedOrigins)) {
        throw new TypeError("CorsInit.allowedOrigins must be a string array.");
    }

    if (value.allowedHeaders !== undefined && !isStringArray(value.allowedHeaders)) {
        throw new TypeError("CorsInit.allowedHeaders must be a string array.");
    }

    if (value.exposedHeaders !== undefined && !isStringArray(value.exposedHeaders)) {
        throw new TypeError("CorsInit.exposedHeaders must be a string array.");
    }

    if (value.allowCredentials !== undefined && typeof value.allowCredentials !== "boolean") {
        throw new TypeError("CorsInit.allowCredentials must be a boolean.");
    }

    if (value.maxAge !== undefined && (typeof value.maxAge !== "number" || isNaN(value.maxAge))) {
        throw new TypeError("CorsInit.maxAge must be a number.");
    }
}
