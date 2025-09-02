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
import { env, ctx } from "./mock";
import { GET_REQUEST } from "./constants";
import { BasicWorker } from "../src/basic-worker";
import { Middleware } from "../src/middleware";
import { Unauthorized } from "../src/errors";
import { Worker } from "../src/worker";

class TestWorker extends BasicWorker {
    constructor(request: Request) {
        super(request, env, ctx);
    }
    protected setup(): void {
        this.use(new PostHandler());
    }

    protected override async dispatch(): Promise<Response> {
        return new Response("Ok");
    }
}

class AuthWorker extends TestWorker {
    protected setup(): void {
        this.use(new PreHandler()).use(new AuthHandler()).use(new PostHandler());
    }
}

class PreHandler extends Middleware {}

class PostHandler extends Middleware {
    protected override post(_worker: Worker, response: Response): void {
        response.headers.set("x-post-handler", "true");
    }
}

class AuthHandler extends Middleware {
    protected override pre(worker: Worker): Promise<Response> {
        return new Unauthorized(worker).getResponse();
    }
}

describe("middleware unit tests", () => {
    it("adds a header to the response in post", async () => {
        const worker = new TestWorker(GET_REQUEST);
        const response = await worker.fetch();
        expect([...response.headers.entries()]).toStrictEqual([
            ["content-type", "text/plain;charset=UTF-8"],
            ["x-post-handler", "true"],
        ]);
    });

    it("interrupts middleware processing with unauthorized", async () => {
        const worker = new AuthWorker(GET_REQUEST);
        const response = await worker.fetch();
        const json = await response.json();
        expect(json).toStrictEqual({
            details: "",
            error: "Unauthorized",
            status: 401,
        });
        expect([...response.headers.entries()]).toStrictEqual([
            ["cache-control", "no-cache, no-store, must-revalidate, max-age=0"],
            ["content-type", "application/json; charset=utf-8"],
            ["x-content-type-options", "nosniff"],
        ]);
    });
});
