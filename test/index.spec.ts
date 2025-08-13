import { describe, it, expect } from "vitest";
import worker from "./index";
import type { ExecutionContext } from "@cloudflare/workers-types";

const mockCtx: ExecutionContext = {
    waitUntil: () => {},
    passThroughOnException: () => {},
    props: () => {},
};

const mockEnv = {
    MY_KV: {
        get: async (key: string) => `mock-value-for-${key}`,
        put: async (_key: string, _value: string) => {},
    },
    MY_SECRET: "mock-secret",
};

describe("Hello World worker", () => {
    it("responds with Hello World!", async () => {
        const response = await worker.fetch(
            new Request("https://example.com"),
            mockEnv,
            mockCtx
        );
        expect(await response.text()).toBe("Hello World!");
    });
});
