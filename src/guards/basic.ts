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
 * Checks if the provided value is an array of strings.
 *
 * @param value - The value to check.
 * @returns True if `array` is an array where every item is a string.
 */
export function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/**
 * Checks if a value is a string.
 *
 * @param value - The value to check.
 * @returns `true` if the value is a string, otherwise `false`.
 */
export function isString(value: unknown): value is string {
    return typeof value === "string";
}

/**
 * Checks if a value is a function.
 *
 * @param value - The value to check.
 * @returns `true` if the value is a function, otherwise `false`.
 */
export function isFunction(value: unknown): value is Function {
    return typeof value === "function";
}

/**
 * Checks if a value is a valid number (not NaN).
 *
 * This function returns `true` if the value is of type `number`
 * and is not `NaN`. It works as a type guard for TypeScript.
 *
 * @param value - The value to check.
 * @returns `true` if the value is a number and not `NaN`, otherwise `false`.
 */
export function isNumber(value: unknown): value is number {
    return typeof value === "number" && !Number.isNaN(value);
}

/**
 * Checks if a value is a boolean.
 *
 * @param value - The value to check.
 * @returns `true` if the value is a boolean (`true` or `false`), otherwise `false`.
 */
export function isBoolean(value: unknown): value is boolean {
    return typeof value === "boolean";
}
