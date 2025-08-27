import { describe, it, expect } from "vitest";
import worker from "./worker-export";
import { env, ctx } from "./mock";

describe("Hello World worker", () => {
    it("responds with Hello World!", async () => {
        const response = await worker.fetch(new Request("https://example.com"), env, ctx);
        expect(await response.text()).toBe("Hello World!");
    });
});
