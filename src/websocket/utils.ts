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

import { isNumber, isString } from "../guards/basic";

import { CloseCode, WS_MAX_CLOSE_CODE, WS_MAX_REASON_CHARS, WS_RESERVED_CODES } from "./constants";

/**
 * Normalizes a WebSocket close code to ensure it is safe to send.
 *
 * - Returns `CloseCode.NORMAL` if the code is undefined, out of range, or reserved.
 *
 * @param code - The optional close code to validate.
 * @returns A valid close code to use for WebSocket closure.
 */
export function safeCloseCode(code?: number): number {
    if (!isNumber(code)) return CloseCode.NORMAL;
    if (isCodeInRange(code) && !isReservedCode(code)) return code;
    return CloseCode.NORMAL;
}

/**
 * Determines whether a close code is within the valid WebSocket range.
 *
 * @param code - The code to validate.
 * @returns `true` if the code is within 1000–4999, `false` otherwise.
 */
export function isCodeInRange(code: number): boolean {
    return code >= CloseCode.NORMAL && code <= WS_MAX_CLOSE_CODE;
}

/**
 * Determines whether a close code is reserved by the WebSocket specification.
 *
 * @param code - The code to check.
 * @returns `true` if the code is reserved, `false` otherwise.
 */
export function isReservedCode(code: number): boolean {
    return WS_RESERVED_CODES.has(code);
}

/**
 * Sanitizes a close reason string to comply with WebSocket limits.
 *
 * - Removes non-printable ASCII characters.
 * - Truncates to the maximum allowed length (`WS_MAX_REASON_CHARS`).
 *
 * @param reason - The optional reason string to sanitize.
 * @returns A cleaned reason string or `undefined` if input is invalid.
 */
export function safeReason(reason?: string): string | undefined {
    if (!isString(reason)) return;
    return reason.replaceAll(/[^\x20-\x7E]/g, "").slice(0, WS_MAX_REASON_CHARS);
}
