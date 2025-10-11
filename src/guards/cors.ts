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

import { CorsInit } from "../interfaces/cors";

import { isBoolean, isNumber, isStringArray } from "./basic";

/**
 * Throws if the given value is not a valid CorsInit.
 *
 * Checks only the fields that are present, since CorsInit is Partial<CorsConfig>.
 *
 * @param value - The value to check.
 */
export function assertCorsInit(value: unknown): asserts value is CorsInit {
    if (value === undefined) return;

    if (typeof value !== "object" || value === null) {
        throw new TypeError("CorsInit must be an object.");
    }

    const obj = value as Record<string, unknown>;

    if (obj["allowedOrigins"] !== undefined && !isStringArray(obj["allowedOrigins"])) {
        throw new TypeError("CorsInit.allowedOrigins must be a string array.");
    }

    if (obj["allowedHeaders"] !== undefined && !isStringArray(obj["allowedHeaders"])) {
        throw new TypeError("CorsInit.allowedHeaders must be a string array.");
    }

    if (obj["exposedHeaders"] !== undefined && !isStringArray(obj["exposedHeaders"])) {
        throw new TypeError("CorsInit.exposedHeaders must be a string array.");
    }

    if (obj["allowCredentials"] !== undefined && !isBoolean(obj["allowCredentials"])) {
        throw new TypeError("CorsInit.allowCredentials must be a boolean.");
    }

    if (obj["maxAge"] !== undefined && !isNumber(obj["maxAge"])) {
        throw new TypeError("CorsInit.maxAge must be a number.");
    }
}
