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
import { RestoredConnectionBase } from "@src/websocket/restore";
import { describe, it, expect, beforeEach, vi } from "vitest";

class TestConnection extends RestoredConnectionBase<{}> {
    getAccepted() {
        return this.accepted;
    }

    getServer() {
        return this.server;
    }
}

describe("restore connection base unit tests", () => {
    let con: TestConnection;
    let ws: WebSocket;

    beforeEach(() => {
        ws = new MockWebSocket();
        con = new TestConnection(ws);
        vi.clearAllMocks();
    });

    it("restores the connection from a websocket", () => {
        expect(con.getServer()).toBe(ws);
    });

    it("sets the accepted flag on restore", () => {
        expect(con.getAccepted()).toBe(true);
    });

    it("throws an error on accept", () => {
        expect(() => con.accept()).toThrowError("Do not call accept() on restore");
    });

    it("throws an error on accept web socket", () => {
        expect(() => con.acceptWebSocket()).toThrowError("Do not call acceptWebSocket() on restore");
    });
});
