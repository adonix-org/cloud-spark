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
export function assertOctetStreamInit(value: unknown): value is OctetStreamInit {
    if (typeof value !== "object" || value === null) {
        throw new TypeError("OctetStreamInit must be a non-null object");
    }

    const init = value as Partial<OctetStreamInit>;
    const { size, offset = 0, length = size } = init;

    if (!isNumber(size) || size < 0) {
        throw new RangeError("size must be a non-negative number");
    }

    if (!isNumber(offset) || offset < 0 || offset > size) {
        throw new RangeError("offset out of bounds");
    }

    if (!isNumber(length) || length < 0 || offset + length > size) {
        throw new RangeError("length out of bounds");
    }

    return true;
}
