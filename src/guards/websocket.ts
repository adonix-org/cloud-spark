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

import { CloseCode, WS_MAX_CLOSE_CODE, WS_MAX_REASON_CHARS, WS_RESERVED_CODES } from "../constants";
import { isNumber, isString } from "./basic";

export function isBinary(value: unknown): value is ArrayBuffer | ArrayBufferView {
    return value instanceof ArrayBuffer || ArrayBuffer.isView(value);
}

export function isSendable(value: unknown): value is string | ArrayBuffer | ArrayBufferView {
    if (isString(value)) return value.length > 0;
    if (isBinary(value)) return value.byteLength > 0;
    return false;
}

export function safeCloseCode(code?: number): number {
    if (!isNumber(code)) return CloseCode.NORMAL;
    if (isCodeInRange(code) && !isReservedCode(code)) return code;
    return CloseCode.NORMAL;
}

export function isCodeInRange(code: number): boolean {
    return code >= CloseCode.NORMAL && code <= WS_MAX_CLOSE_CODE;
}

export function isReservedCode(code: number): boolean {
    return WS_RESERVED_CODES.has(code);
}

export function safeReason(reason?: string): string | undefined {
    if (!isString(reason)) return;
    return reason.replace(/[^\x20-\x7E]/g, "").slice(0, WS_MAX_REASON_CHARS);
}

export function assertSerializable(value: unknown): asserts value is object {
    if (value === null || typeof value !== "object") {
        throw new TypeError("WebSocket attachment must be a non-null object");
    }
    try {
        JSON.stringify(value);
    } catch {
        throw new TypeError("WebSocket attachment is non-serializable");
    }
}
