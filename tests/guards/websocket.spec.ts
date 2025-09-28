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

import { describe, it, expect } from "vitest";
import {
    isBinary,
    isSendable,
    safeCloseCode,
    isCodeInRange,
    isReservedCode,
    safeReason,
    assertSerializable,
} from "@src/guards/websocket";
import {
    CloseCode,
    WS_MAX_CLOSE_CODE,
    WS_MAX_REASON_CHARS,
    WS_RESERVED_CODES,
} from "@src/constants/websocket";

const bufferView = new Uint8Array([1, 2, 3]);

describe("websocket guard unit tests", () => {
    describe("is binary function", () => {
        it("detects ArrayBuffer", () => {
            expect(isBinary(new ArrayBuffer(8))).toBe(true);
        });

        it("detects ArrayBufferView", () => {
            expect(isBinary(bufferView)).toBe(true);
        });

        it("rejects other types", () => {
            expect(isBinary("foo")).toBe(false);
            expect(isBinary(123)).toBe(false);
            expect(isBinary(null)).toBe(false);
            expect(isBinary(undefined)).toBe(false);
        });
    });

    describe("is sendable function", () => {
        it("accepts non-empty strings", () => {
            expect(isSendable("hello")).toBe(true);
        });

        it("rejects empty strings", () => {
            expect(isSendable("")).toBe(false);
        });

        it("accepts ArrayBuffer with length > 0", () => {
            expect(isSendable(new ArrayBuffer(4))).toBe(true);
        });

        it("accepts ArrayBufferView with byteLength > 0", () => {
            expect(isSendable(bufferView)).toBe(true);
        });

        it("rejects empty ArrayBuffer", () => {
            expect(isSendable(new ArrayBuffer(0))).toBe(false);
        });

        it("rejects other types", () => {
            expect(isSendable(123)).toBe(false);
            expect(isSendable(null)).toBe(false);
            expect(isSendable(undefined)).toBe(false);
        });
    });

    describe("safe close code function", () => {
        it("returns NORMAL for undefined", () => {
            expect(safeCloseCode()).toBe(CloseCode.NORMAL);
        });

        it("returns given code if valid and not reserved", () => {
            const valid = CloseCode.NORMAL + 1;
            if (!WS_RESERVED_CODES.has(valid)) {
                expect(safeCloseCode(valid)).toBe(valid);
            }
        });

        it("returns NORMAL for out-of-range codes", () => {
            expect(safeCloseCode(-1)).toBe(CloseCode.NORMAL);
            expect(safeCloseCode(WS_MAX_CLOSE_CODE + 1)).toBe(CloseCode.NORMAL);
        });

        it("returns NORMAL for reserved codes", () => {
            for (const code of WS_RESERVED_CODES) {
                expect(safeCloseCode(code)).toBe(CloseCode.NORMAL);
            }
        });
    });

    describe("is code in range function", () => {
        it("detects codes within range", () => {
            expect(isCodeInRange(CloseCode.NORMAL)).toBe(true);
            expect(isCodeInRange(WS_MAX_CLOSE_CODE)).toBe(true);
        });

        it("detects codes out of range", () => {
            expect(isCodeInRange(CloseCode.NORMAL - 1)).toBe(false);
            expect(isCodeInRange(WS_MAX_CLOSE_CODE + 1)).toBe(false);
        });
    });

    describe("is reserved code function", () => {
        it("detects reserved codes", () => {
            for (const code of WS_RESERVED_CODES) {
                expect(isReservedCode(code)).toBe(true);
            }
        });

        it("returns false for non-reserved codes", () => {
            expect(isReservedCode(CloseCode.NORMAL)).toBe(false);
        });
    });

    describe("is safe reason function", () => {
        it("returns undefined for non-string inputs", () => {
            expect(safeReason()).toBe(undefined);
            expect(safeReason(null as any)).toBe(undefined);
            expect(safeReason(123 as any)).toBe(undefined);
        });

        it("sanitizes control characters", () => {
            const input = "Hello\x01\x02World";
            expect(safeReason(input)).toBe("HelloWorld");
        });

        it("truncates long strings", () => {
            const long = "A".repeat(WS_MAX_REASON_CHARS + 10);
            expect(safeReason(long)?.length).toBe(WS_MAX_REASON_CHARS);
        });

        it("leaves valid strings unchanged", () => {
            const input = "Hello World!";
            expect(safeReason(input)).toBe(input);
        });
    });

    describe("assert serializable function", () => {
        it("allows plain objects", () => {
            const obj = { a: 1, b: { c: 2 } };
            expect(() => assertSerializable(obj)).not.toThrow();
        });

        it("throws for null", () => {
            expect(() => assertSerializable(null)).toThrow(
                "WebSocket attachment must be an object",
            );
        });

        it("throws for primitives", () => {
            expect(() => assertSerializable("hello")).toThrow(
                "WebSocket attachment must be an object",
            );
            expect(() => assertSerializable(42)).toThrow("WebSocket attachment must be an object");
            expect(() => assertSerializable(true)).toThrow(
                "WebSocket attachment must be an object",
            );
        });

        it("throws for circular objects", () => {
            const obj: any = {};
            obj.self = obj;
            expect(() => assertSerializable(obj)).toThrow(
                "WebSocket attachment is not serializable",
            );
        });

        it("strips functions and symbols when stringify is called", () => {
            const obj: any = { a: 1, fn: () => {}, sym: Symbol("x") };
            expect(() => assertSerializable(obj)).not.toThrow();

            const json = JSON.stringify(obj);
            expect(json).toBe(JSON.stringify({ a: 1 }));
        });

        it("allows arrays", () => {
            const arr = [1, 2, 3, { a: 4 }];
            expect(() => assertSerializable(arr)).not.toThrow();
        });
    });
});
