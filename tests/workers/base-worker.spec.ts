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
import { env, ctx } from "@mock";
import { BODY_INIT, GET_REQUEST, VALID_URL } from "@constants";
import { BaseWorker } from "@src/workers/base-worker";
import { Method } from "@src/common";

class TestWorker extends BaseWorker {
    protected async dispatch(): Promise<Response> {
        return new Response(BODY_INIT);
    }

    public async fetch(): Promise<Response> {
        return this.dispatch();
    }

    // This method is protected in base worker.
    public override create(request: Request): this {
        return super.create(request);
    }
}

describe("base worker unit tests", () => {
    let worker: TestWorker;

    beforeEach(() => {
        worker = new TestWorker(GET_REQUEST, env, ctx);
    });

    it("returns constructor parameters via getters", () => {
        expect(worker.request).toBe(GET_REQUEST);
        expect(worker.env).toBe(env);
        expect(worker.ctx).toBe(ctx);
    });

    it("creates a worker that is same type", () => {
        const newWorker = worker.create(GET_REQUEST);
        expect(newWorker).toBeInstanceOf(TestWorker);
    });

    it("creates a worker that returns a new instance", () => {
        const newWorker = worker.create(GET_REQUEST);
        expect(newWorker).not.toBe(worker);
    });

    it("creates a worker that retains env and ctx", () => {
        const newWorker = worker.create(GET_REQUEST);
        expect(newWorker.env).toBe(env);
        expect(newWorker.ctx).toBe(ctx);
    });

    it("creates a worker with the provided request", () => {
        const newWorker = worker.create(new Request(GET_REQUEST, { method: Method.HEAD }));
        expect(newWorker.request).not.toBe(GET_REQUEST);
        expect(newWorker.request.method).toBe(Method.HEAD);
        expect(newWorker.request.url).toBe(VALID_URL);
    });

    it("creates a fetch-enabled worker using ignite", async () => {
        const handler = TestWorker.ignite();
        const response = await handler.fetch(GET_REQUEST, env, ctx);
        expect(response).toBeInstanceOf(Response);
        expect(await response.text()).toBe(BODY_INIT);
    });

    it("creates a new worker instance for each fetch call", async () => {
        const instances: BaseWorker[] = [];

        class LocalTestWorker extends BaseWorker {
            protected dispatch(): Promise<Response> {
                throw new Error("Method not implemented.");
            }
            constructor(...args: ConstructorParameters<typeof BaseWorker>) {
                super(...args);
                instances.push(this);
            }

            async fetch() {
                return new Response(BODY_INIT);
            }
        }

        const handler = LocalTestWorker.ignite();

        const responses = await Promise.all([
            handler.fetch(GET_REQUEST, env, ctx),
            handler.fetch(GET_REQUEST, env, ctx),
        ]);

        expect(instances.length).toBe(2);
        expect(instances[0]).not.toBe(instances[1]);

        expect(await responses[0].text()).toBe(BODY_INIT);
        expect(await responses[1].text()).toBe(BODY_INIT);
    });
});
