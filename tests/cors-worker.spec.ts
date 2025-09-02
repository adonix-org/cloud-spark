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

import {  describe, expect, it } from "vitest";
import { CorsWorker } from "../src/cors-worker";
import { GET_REQUEST, GET_REQUEST_WITH_ORIGIN } from "./constants";
import { ctx, env } from "./mock";

class TestWorker extends CorsWorker {
    public override async get(): Promise<Response> {
        return new Response("OK");
    }
}

describe("cors worker unit tests", () => {
    it("returns response with cors headers", async () => {
        const worker = new TestWorker(GET_REQUEST_WITH_ORIGIN, env, ctx);
        const response = await worker.fetch();
        expect([...response.headers.entries()]).toStrictEqual([
            ["access-control-allow-headers", "Content-Type"],
            ["access-control-allow-methods", "GET, HEAD, OPTIONS"],
            ["access-control-allow-origin", "*"],
            ["access-control-max-age", "604800"],
            ["content-type", "text/plain;charset=UTF-8"],
        ]);
    });

    it("returns response without cors headers", async () => {
        const worker = new TestWorker(GET_REQUEST, env, ctx);
        const response = await worker.fetch();
        expect([...response.headers.entries()]).toStrictEqual([
            ["content-type", "text/plain;charset=UTF-8"],
        ]);
    });
});
