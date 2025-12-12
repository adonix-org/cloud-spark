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

import { Method } from "../core";

import { isString } from "./basic";

/**
 * A set containing all supported HTTP methods.
 *
 * Useful for runtime checks like validating request methods.
 */
const METHOD_SET: Set<string> = new Set(Object.values(Method));

/**
 * Type guard that checks if a string is a valid HTTP method.
 *
 * @param value - The string to test.
 * @returns True if `value` is a recognized HTTP method.
 */
export function isMethod(value: unknown): value is Method {
    return isString(value) && METHOD_SET.has(value);
}

/**
 * Checks if a value is an array of valid HTTP methods.
 *
 * Each element is verified using the `isMethod` type guard.
 *
 * @param value - The value to check.
 * @returns `true` if `value` is an array and every element is a valid `Method`, otherwise `false`.
 */
export function isMethodArray(value: unknown): value is Method[] {
    return Array.isArray(value) && value.every(isMethod);
}

/**
 * Asserts that a value is an array of valid HTTP methods.
 *
 * This function uses {@link isMethodArray} to validate the input. If the
 * value is not an array of `Method` elements, it throws a `TypeError`.
 * Otherwise, TypeScript will narrow the type of `value` to `Method[]`
 * within the calling scope.
 *
 * @param value - The value to check.
 * @throws TypeError If `value` is not a valid {@link Method} array.
 */
export function assertMethods(value: unknown): asserts value is Method[] {
    if (!isMethodArray(value)) {
        const desc = Array.isArray(value) ? JSON.stringify(value) : String(value);
        throw new TypeError(`Invalid method array: ${desc}`);
    }
}
