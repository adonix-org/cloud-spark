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

import { MockWebSocket } from "@mock";
import { WebSocketEvents } from "@src/websocket/events";
import { beforeEach, describe, expect, it, vi } from "vitest";

class TestConnection extends WebSocketEvents {
    triggerWarn(msg: string) {
        this.warn(msg);
    }
    triggerOpen() {
        this.open();
    }
}

describe("WebSocketEvents unit tests", () => {
    let con: TestConnection;
    let server: MockWebSocket;

    beforeEach(() => {
        server = new MockWebSocket();
        con = new TestConnection(server);
    });

    it("fires 'warn' event with correct payload", () => {
        const listener = vi.fn((ev) => {
            expect(ev.type).toBe("warn");
            expect(ev.message).toBe("something");
        });
        con.addEventListener("warn", listener);

        con.triggerWarn("something");

        expect(listener).toHaveBeenCalledOnce();
    });

    it("fires the 'open' event only once", () => {
        const listener = vi.fn();
        con.addEventListener("open", listener);

        con.triggerOpen();
        con.triggerOpen();

        expect(listener).toHaveBeenCalledOnce();
    });

    it("removes custom listeners correctly", () => {
        const listener = vi.fn();
        con.addEventListener("warn", listener);
        con.removeEventListener("warn", listener);

        con.triggerWarn("ignored");

        expect(listener).not.toHaveBeenCalled();
    });

    it("delegates server 'close' event and enforces once", () => {
        const listener = vi.fn();
        con.addEventListener("close", listener);

        server.close(1001, "first");
        server.close(1001, "second");

        expect(listener).toHaveBeenCalledOnce();
    });

    it("adds 'close' listener with once=true if no options provided", () => {
        const listener = vi.fn();
        con.addEventListener("close", listener);

        server.close();
        server.close();

        expect(listener).toHaveBeenCalledOnce();
    });

    it("overrides options with once=true for close event", () => {
        const listener = vi.fn();
        con.addEventListener("close", listener, { once: false });

        server.close();
        server.close();

        expect(listener).toHaveBeenCalledOnce();
    });

    it("does not override undefined options for native message event", () => {
        const listener = vi.fn();
        const ev = new MessageEvent("message", { data: "hi" });
        con.addEventListener("message", listener);

        server.dispatchEvent(ev);
        server.dispatchEvent(ev);

        expect(listener).toHaveBeenCalledTimes(2);
    });

    it("does not override provided options once=false for native message event", () => {
        const listener = vi.fn();
        const ev = new MessageEvent("message", { data: "hi" });
        con.addEventListener("message", listener, { once: false });

        server.dispatchEvent(ev);
        server.dispatchEvent(ev);

        expect(listener).toHaveBeenCalledTimes(2);
    });

    it("does not override provided options once=true for native message event", () => {
        const listener = vi.fn();
        const ev = new MessageEvent("message", { data: "hi" });
        con.addEventListener("message", listener, { once: true });

        server.dispatchEvent(ev);
        server.dispatchEvent(ev);

        expect(listener).toHaveBeenCalledOnce();
    });

    it("correctly removes server listeners", () => {
        const listener = vi.fn();
        con.addEventListener("close", listener);
        con.removeEventListener("close", listener);

        server.close();

        expect(listener).not.toHaveBeenCalled();
    });

    it("fires multiple custom listeners", () => {
        const called: string[] = [];
        con.addEventListener("warn", () => called.push("a"));
        con.addEventListener("warn", () => called.push("b"));

        con.triggerWarn("msg");

        expect(called).toEqual(["a", "b"]);
    });

    it("removes non-existent listener without error", () => {
        expect(() => con.removeEventListener("warn", () => {})).not.toThrow();
    });

    it("handles empty listeners without error", () => {
        expect(() => {
            con.triggerWarn("nothing");
        }).not.toThrow();
    });
});
