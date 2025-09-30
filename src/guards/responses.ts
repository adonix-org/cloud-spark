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

import { OctetStreamInit } from "../interfaces";
import { isNumber } from "./basic";

/**
 * Asserts that a given value is a valid `OctetStreamInit` object.
 *
 * Properties:
 * - `size` (required): must be a non-negative number.
 * - `offset` (optional): if provided, must be a number between 0 and `size`.
 * - `length` (optional): if provided, must be a non-negative number such that `offset + length <= size`.
 *
 * If `offset` or `length` are `undefined`, they are considered as `0` and `size` respectively.
 *
 * Throws an error if validation fails.
 *
 * Acts as a TypeScript type predicate, so after calling it, `value` is narrowed to `OctetStreamInit`.
 *
 * @param value - The value to validate as `OctetStreamInit`.
 * @throws {TypeError} If the value is not a non-null object.
 * @throws {RangeError} If `size`, `offset`, or `length` are invalid.
 * @returns `true` if the value is a valid `OctetStreamInit`.
 */
export function assertOctetStreamInit(value: unknown): asserts value is OctetStreamInit {
    if (typeof value !== "object" || value === null) {
        throw new TypeError("OctetStreamInit must be an object.");
    }

    const obj = value as Record<string, unknown>;

    // size
    const size = obj["size"];
    if (!isNumber(size) || size < 0 || !Number.isInteger(size)) {
        throw new RangeError(
            `OctetStreamInit.size must be a non-negative integer (size=${String(size)}).`,
        );
    }

    // offset
    const offset = obj["offset"] ?? 0;
    if (!isNumber(offset) || offset < 0 || offset > size || !Number.isInteger(offset)) {
        throw new RangeError(
            `OctetStreamInit.offset must be a non-negative integer less than or equal to size (size=${String(size)}, offset=${String(offset)}).`,
        );
    }

    // length
    const length = obj["length"] ?? size - offset;
    if (!isNumber(length) || length < 0 || offset + length > size || !Number.isInteger(length)) {
        throw new RangeError(
            `OctetStreamInit.length must be a non-negative integer less than or equal to size - offset (size=${String(size)}, offset=${String(offset)}, length=${String(length)}).`,
        );
    }
}
