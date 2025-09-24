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
import { createMockWebSocketPair } from "@mock";
import { BaseWebSocket } from "@src/websocket/base";
import { describe, it, expect } from "vitest";

class TestWebSocket extends BaseWebSocket {
    constructor(ws: WebSocket) {
        super(ws);
        this.accepted = true;
    }
}

describe("BaseWebSocket (smoke test)", () => {
    it("can send a message", () => {
        const [client, server] = createMockWebSocketPair();
        const ws = new TestWebSocket(server as any);

        const messages: string[] = [];
        client.addEventListener("message", (ev: MessageEvent) => messages.push(ev.data));

        ws.send("hello world");

        expect(messages).toEqual(["hello world"]);

        ws.close(1000);
    });
});
