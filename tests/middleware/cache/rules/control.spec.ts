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

import { CacheControlRule } from "@src/middleware/cache/rules/control";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as utils from "@src/middleware/cache/utils";
import * as ruleUtils from "@src/middleware/cache/rules/utils";

describe("cache control rule unit tests", () => {
    let rule: CacheControlRule;
    let worker: any;
    let next: () => Promise<Response | undefined>;

    beforeEach(() => {
        rule = new CacheControlRule();

        worker = {
            request: {
                headers: new Headers(),
            },
        };

        next = vi.fn(async () => new Response("ok", { status: 200 }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns undefined if no-store is set", async () => {
        vi.spyOn(utils, "getCacheControl").mockReturnValue({ "no-store": true });

        const result = await rule.apply(worker, next);
        expect(result).toBeUndefined();
    });

    it("returns undefined if max-age=0 and no validators", async () => {
        vi.spyOn(utils, "getCacheControl").mockReturnValue({ "max-age": 0 });
        vi.spyOn(ruleUtils, "hasCacheValidator").mockReturnValue(false);

        const result = await rule.apply(worker, next);
        expect(result).toBeUndefined();
    });

    it("calls next and returns response if cache allows it", async () => {
        vi.spyOn(utils, "getCacheControl").mockReturnValue({ "max-age": 3600 });
        vi.spyOn(ruleUtils, "hasCacheValidator").mockReturnValue(false);

        const result = await rule.apply(worker, next);
        expect(result).toBeInstanceOf(Response);
        expect(next).toHaveBeenCalledOnce();
    });

    it("returns undefined if next returns undefined", async () => {
        next = vi.fn(async () => undefined);
        vi.spyOn(utils, "getCacheControl").mockReturnValue({ "max-age": 3600 });
        vi.spyOn(ruleUtils, "hasCacheValidator").mockReturnValue(false);

        const result = await rule.apply(worker, next);
        expect(result).toBeUndefined();
    });
});
