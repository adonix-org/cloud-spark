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

import { describe, it, expect, beforeEach } from "vitest";
import { env, ctx } from "./mock";
import { GET_REQUEST, TestCorsWorker } from "./constants";
import { Method, Time } from "../src/common";

describe("cors worker defaults", () => {
    let worker: TestCorsWorker;

    beforeEach(() => {
        worker = new TestCorsWorker(GET_REQUEST, env, ctx);
    });

    it("returns ['*'] for allow origins", () => {
        expect(worker.getAllowOrigins()).toStrictEqual(["*"]);
    });

    it("allows any origin", () => {
        expect(worker.allowAnyOrigin()).toBe(true);
    });

    it("returns correct default allowed methods", () => {
        expect(worker.getAllowMethods()).toStrictEqual([Method.GET, Method.OPTIONS, Method.HEAD]);
    });

    it("returns correct default allowed headers", () => {
        expect(worker.getAllowHeaders()).toStrictEqual(["Content-Type"]);
    });

    it("returns empty array for exposed headers", () => {
        expect(worker.getExposeHeaders()).toStrictEqual([]);
    });

    it("returns correct default max age", () => {
        expect(worker.getMaxAge()).toBe(Time.Week);
    });
});
