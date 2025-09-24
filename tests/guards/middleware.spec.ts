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
import { assertMiddleware } from "@src/guards/middleware";
import { Middleware } from "@src/middleware/middleware";

describe("middleware guard unit tests", () => {
    class TestMiddleware extends Middleware {
        async handle(_worker: any, next: () => Promise<Response>): Promise<Response> {
            return next();
        }
    }

    it("does not throw for a valid Middleware subclass", () => {
        const instance = new TestMiddleware();
        expect(() => assertMiddleware(instance)).not.toThrow();
    });

    it("throws for a plain object", () => {
        const obj = { handle: () => {} };
        expect(() => assertMiddleware(obj)).toThrow(TypeError);
    });

    it("throws for a function", () => {
        const fn = () => {};
        expect(() => assertMiddleware(fn)).toThrow(TypeError);
    });

    it("throws for null", () => {
        expect(() => assertMiddleware(null)).toThrow(TypeError);
    });

    it("throws for undefined", () => {
        expect(() => assertMiddleware(undefined)).toThrow(TypeError);
    });

    it("throws for a class not extending Middleware", () => {
        class NotMiddleware {
            sonarqube = "quiet";
        }
        const instance = new NotMiddleware();
        expect(() => assertMiddleware(instance)).toThrow(TypeError);
    });
});
