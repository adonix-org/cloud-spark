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

import { BaseWebSocket } from "@src/websocket/base";
import { describe, it, expect } from "vitest";

class TestConnection extends BaseWebSocket {
    constructor(ws: WebSocket) {
        super(ws);
        this.accepted = true;
    }
}

describe("BaseWebSocket (smoke test)", () => {
    it("can send a message", () => {
        const pair = new WebSocketPair();
        const [client, server] = [pair[0], pair[1]];
        const ws = new TestConnection(server);

        const warnings: string[] = [];
        ws.addEventListener("warn", (event) => {
            warnings.push(event.message);
        });

        const messages: string[] = [];
        client.addEventListener("message", (ev: MessageEvent) => messages.push(ev.data));

        ws.send("hello world");

        expect(messages).toEqual(["hello world"]);

        ws.close(1000);

        ws.send("After close.");

        expect(warnings).toEqual(["Cannot send: WebSocket not open"]);
    });
});
