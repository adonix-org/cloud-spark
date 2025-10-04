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

import { StatusCodes } from "@src/constants";
import { Worker } from "@src/interfaces/worker";
import { CacheValidators } from "@src/middleware/cache/rules/interfaces";
import { getCacheValidators } from "@src/middleware/cache/rules/utils";
import { ValidationRule } from "@src/middleware/cache/rules/validation";
import { describe, expect, it } from "vitest";

class MockValidationRule extends ValidationRule<string> {
    public lastHeader?: string;
    public lastValidators?: CacheValidators;
    public responseReturn?: Response | undefined = undefined;

    protected getHeader(response: Response): string | undefined {
        return response.headers.get("X-Test") || undefined;
    }

    protected async response(
        response: Response,
        header: string,
        validators: CacheValidators,
    ): Promise<Response | undefined> {
        this.lastHeader = header;
        this.lastValidators = validators;
        return this.responseReturn ?? response;
    }
}

function createWorker(headers?: Record<string, string>): Worker {
    return {
        request: {
            headers: new Headers(headers),
        },
    } as unknown as Worker;
}

function createResponse(status = StatusCodes.OK, headerValue?: string): Response {
    const headers = new Headers();
    if (headerValue) headers.set("X-Test", headerValue);
    return new Response(null, { status, headers });
}

describe("validation rule unit tests", () => {
    it("returns undefined if next() returns undefined", async () => {
        const rule = new MockValidationRule();
        const worker = createWorker();
        const result = await rule.apply(worker, async () => undefined);
        expect(result).toBeUndefined();
    });

    it("returns the response if status !== 200", async () => {
        const rule = new MockValidationRule();
        const worker = createWorker();
        const resp = createResponse(StatusCodes.NOT_FOUND);
        const result = await rule.apply(worker, async () => resp);
        expect(result).toBe(resp);
    });

    it("returns response if header is missing", async () => {
        const rule = new MockValidationRule();
        const worker = createWorker();
        const resp = createResponse(StatusCodes.OK); // no X-Test header
        const result = await rule.apply(worker, async () => resp);
        expect(result).toBe(resp);
    });

    it("calls response with correct header and validators", async () => {
        const rule = new MockValidationRule();
        const worker = createWorker({
            "X-Test": "header-value",
            "If-Match": "abc",
            "If-None-Match": "def",
            "If-Modified-Since": "Wed, 21 Oct 2015 07:28:00 GMT",
            "If-Unmodified-Since": "Wed, 21 Oct 2015 07:28:00 GMT",
        });
        const resp = createResponse(StatusCodes.OK, "header-value");

        const result = await rule.apply(worker, async () => resp);

        expect(result).toBe(resp);
        expect(rule.lastHeader).toBe("header-value");
        expect(rule.lastValidators).toEqual(getCacheValidators(worker.request.headers));
    });

    it("returns whatever response returns", async () => {
        const rule = new MockValidationRule();
        const worker = createWorker({ "X-Test": "value" });
        const customResp = new Response("custom", { status: StatusCodes.OK });
        rule.responseReturn = customResp;

        const resp = createResponse(StatusCodes.OK, "value");
        const result = await rule.apply(worker, async () => resp);

        expect(result).toBe(customResp);
    });
});
