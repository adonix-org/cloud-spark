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

import { CacheInit } from "../interfaces/cache";
import { isFunction, isString } from "./basic";

/**
 * Asserts that a value is a valid {@link CacheInit} object.
 *
 * Ensures that if provided, `name` is a string and `getKey` is a function.
 *
 * @param value - The value to check.
 * @throws TypeError If the object shape is invalid.
 */
export function assertCacheInit(value: unknown): asserts value is CacheInit {
    if (typeof value !== "object" || value === null) {
        throw new TypeError("CacheInit must be an object.");
    }

    const { name, getKey } = value as Partial<CacheInit>;

    assertCacheName(name);
    assertGetKey(getKey);
}

/**
 * Asserts that a value is a string suitable for a cache name.
 *
 * If the value is `undefined`, this function does nothing.
 * Otherwise, it throws a `TypeError` if the value is not a string.
 *
 * @param value - The value to check.
 * @throws TypeError If the value is defined but not a string.
 */
export function assertCacheName(value: unknown): asserts value is string | undefined {
    if (value === undefined) return;
    if (!isString(value)) {
        throw new TypeError("Cache name must be a string.");
    }
}

/**
 * Asserts that a value is a function suitable for `getKey`.
 *
 * If the value is `undefined`, this function does nothing.
 * Otherwise, it throws a `TypeError` if the value is not a function.
 *
 * @param value - The value to check.
 * @throws TypeError If the value is defined but not a function.
 */
export function assertGetKey(value: unknown): asserts value is Function | undefined {
    if (value === undefined) return;
    if (!isFunction(value)) {
        throw new TypeError("getKey must be a function.");
    }
}

/**
 * Asserts that a value is a `URL` instance suitable for use as a cache key.
 *
 * If the value is not a `URL`, this function throws a `TypeError`.
 *
 * @param value - The value to check.
 * @throws TypeError If the value is not a `URL`.
 */
export function assertKey(value: unknown): asserts value is URL {
    if (!(value instanceof URL)) {
        throw new TypeError("getKey must return a URL.");
    }
}
