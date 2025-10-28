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

import { SecurityRule } from "@src/middleware/cache/rules/security";
import { UpgradeRule } from "@src/middleware/cache/rules/upgrade";
import { describe, expect, it, vi } from "vitest";

describe("upgrade rule unit tests", () => {
    it("returns undefined for cookie requests", async () => {
        const rule = new SecurityRule();
        const worker = {
            request: { headers: new Headers({ Cookie: "sessionId=abc123;" }) },
        } as any;

        const resp = new Response("ok");
        const next = vi.fn(async () => resp);

        const result = await rule.apply(worker, next);
        expect(next).toHaveBeenCalledTimes(0);
        expect(result).toBeUndefined();
    });

    it("returns undefined for authorization requests", async () => {
        const rule = new SecurityRule();
        const worker = {
            request: {
                headers: new Headers({
                    Authorization: "Basic dXNlcm5hbWU6cGFzc3dvcmQ=",
                }),
            },
        } as any;

        const resp = new Response("ok");
        const next = vi.fn(async () => resp);

        const result = await rule.apply(worker, next);
        expect(next).toHaveBeenCalledTimes(0);
        expect(result).toBeUndefined();
    });

    it("returns undefined for authorization + cookie requests", async () => {
        const rule = new SecurityRule();
        const worker = {
            request: {
                headers: new Headers({
                    Authorization: "Basic dXNlcm5hbWU6cGFzc3dvcmQ=",
                    Cookie: "sessionId=abc123;",
                }),
            },
        } as any;

        const resp = new Response("ok");
        const next = vi.fn(async () => resp);

        const result = await rule.apply(worker, next);
        expect(next).toHaveBeenCalledTimes(0);
        expect(result).toBeUndefined();
    });

    it("returns response for non-secuirty requests", async () => {
        const rule = new UpgradeRule();
        const worker = {
            request: { headers: new Headers() },
        } as any;

        const resp = new Response("ok");
        const next = vi.fn(async () => resp);

        const result = await rule.apply(worker, next);
        expect(next).toHaveBeenCalledOnce();
        expect(result).toBe(resp);
    });
});
