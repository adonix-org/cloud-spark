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

import { NewConnectionBase } from "@src/websocket/new";
import { describe, it, expect, beforeEach, vi } from "vitest";

class TestConnection extends NewConnectionBase<{}> {
    getAccepted() {
        return this.accepted;
    }

    getServer() {
        return this.server;
    }
}

const mockCtx: DurableObjectState = {
    acceptWebSocket: vi.fn((ws, tags?) => [ws, tags]),
} as unknown as DurableObjectState;

describe("new connection base unit tests", () => {
    let con: TestConnection;

    beforeEach(() => {
        con = new TestConnection();
        vi.clearAllMocks();
    });

    it("opens the connection on accept", () => {
        const listener = vi.fn();
        con.addEventListener("open", listener);

        const client = con.accept();

        expect(client).toBeDefined();
        expect(con.getAccepted()).toBe(true);
        expect(listener).toHaveBeenCalledOnce();
    });

    it("opens the connection on accept web socket", () => {
        const listener = vi.fn();
        con.addEventListener("open", listener);

        const client = con.acceptWebSocket(mockCtx);

        expect(client).toBeDefined();
        expect(con.getAccepted()).toBe(true);
        expect(listener).toHaveBeenCalledOnce();
        expect(mockCtx.acceptWebSocket).toHaveBeenCalledExactlyOnceWith(con.getServer(), undefined);
    });

    it("opens the connection on accept web socket and empty tag array", () => {
        const listener = vi.fn();
        con.addEventListener("open", listener);

        const client = con.acceptWebSocket(mockCtx, []);

        expect(client).toBeDefined();
        expect(con.getAccepted()).toBe(true);
        expect(listener).toHaveBeenCalledOnce();
        expect(mockCtx.acceptWebSocket).toHaveBeenCalledExactlyOnceWith(con.getServer(), []);
    });

    it("opens the connection on accept web socket and tags", () => {
        const listener = vi.fn();
        con.addEventListener("open", listener);

        const client = con.acceptWebSocket(mockCtx, ["tag1", "tag2"]);

        expect(client).toBeDefined();
        expect(con.getAccepted()).toBe(true);
        expect(listener).toHaveBeenCalledOnce();
        expect(mockCtx.acceptWebSocket).toHaveBeenCalledExactlyOnceWith(con.getServer(), [
            "tag1",
            "tag2",
        ]);
    });
});
