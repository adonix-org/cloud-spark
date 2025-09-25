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
import { describe, it, expect, beforeEach, vi } from "vitest";

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
        let called = false;
        con.addEventListener("warn", (ev) => {
            expect(ev.type).toBe("warn");
            expect(ev.message).toBe("something");
            called = true;
        });
        con.triggerWarn("something");
        expect(called).toBe(true);
    });

    it("fires the 'open' event only once", () => {
        let count = 0;
        con.addEventListener("open", () => count++);
        con.triggerOpen();
        con.triggerOpen();
        expect(count).toBe(1);
    });

    it("removes custom listeners correctly", () => {
        const listener = vi.fn();
        con.addEventListener("warn", listener);
        con.removeEventListener("warn", listener);
        con.triggerWarn("ignored");
        expect(listener).not.toHaveBeenCalled();
    });

    it("delegates server 'close' event and enforces once", () => {
        let count = 0;
        con.addEventListener("close", () => count++);

        server.close(1001, "first");
        server.close(1001, "second");

        expect(count).toBe(1);
    });

    it("removes server listeners correctly", () => {
        const listener = vi.fn();
        con.addEventListener("close", listener);
        con.removeEventListener("close", listener);

        server.close(1000);

        expect(listener).not.toHaveBeenCalled();
    });


    it("multiple custom listeners all fire", () => {
        const called: string[] = [];
        con.addEventListener("warn", () => called.push("a"));
        con.addEventListener("warn", () => called.push("b"));
        con.triggerWarn("msg");
        expect(called).toEqual(["a", "b"]);
    });

    it("removing non-existent listener is safe", () => {
        expect(() => con.removeEventListener("warn", () => {})).not.toThrow();
    });
});
