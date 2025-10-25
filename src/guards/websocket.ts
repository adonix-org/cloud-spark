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

import { isString } from "./basic";

/**
 * Checks whether a value is binary data suitable for WebSocket transmission.
 *
 * A value is considered binary if it is an {@link ArrayBuffer} or any
 * {@link ArrayBufferView} (such as a `Uint8Array`, `DataView`, etc.).
 *
 * @param value - The value to check.
 * @returns `true` if `value` is an {@link ArrayBuffer} or {@link ArrayBufferView}, otherwise `false`.
 */
export function isBinary(value: unknown): value is ArrayBuffer | ArrayBufferView {
    return value instanceof ArrayBuffer || ArrayBuffer.isView(value);
}

/**
 * Checks whether a value can be sent over a WebSocket connection.
 *
 * A sendable value is either:
 * - a non-empty string, or
 * - a non-empty {@link ArrayBuffer} / {@link ArrayBufferView}.
 *
 * Empty strings and zero-length binary data are considered non-sendable.
 *
 * @param value - The value to check.
 * @returns `true` if `value` is a non-empty string or binary buffer, otherwise `false`.
 */
export function isSendable(value: unknown): value is string | ArrayBuffer | ArrayBufferView {
    if (isString(value)) return value.length > 0;
    if (isBinary(value)) return value.byteLength > 0;
    return false;
}

/**
 * Asserts that a value is a serializable object suitable for JSON encoding.
 *
 * This function ensures the value is a non-null object and that
 * `JSON.stringify()` succeeds without throwing an error.
 *
 * @param value - The value to validate.
 * @throws {TypeError} If `value` is not an object or cannot be serialized to JSON.
 */
export function assertSerializable(value: unknown): asserts value is object {
    if (value === null || typeof value !== "object") {
        throw new TypeError("WebSocket attachment must be an object");
    }
    try {
        JSON.stringify(value);
    } catch {
        throw new TypeError("WebSocket attachment is not serializable");
    }
}
