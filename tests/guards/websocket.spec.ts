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

import { assertSerializable, isBinary, isSendable } from "@src/guards/websocket";
import { describe, expect, it } from "vitest";

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
