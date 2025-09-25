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
import { BaseWebSocket } from "@src/websocket/base";
import { describe, it, expect, beforeEach } from "vitest";

class TestConnection extends BaseWebSocket {
    public readonly client: WebSocket;

    constructor() {
        const pair = new WebSocketPair();
        const [client, server] = [pair[0], pair[1]];
        super(server);
        this.client = client;
    }

    public accept(): WebSocket {
        this.accepted = true;
        return new MockWebSocket();
    }

    public acceptWebSocket(_ctx: DurableObjectState, _tags?: string[]): WebSocket {
        this.accepted = true;
        return new MockWebSocket();
    }
}

describe("base websocket unit tests", () => {
    let con: TestConnection;
    let messages: string[] = [];
    let warnings: string[] = [];

    beforeEach(() => {
        messages = [];
        warnings = [];
        con = new TestConnection();
        con.addEventListener("warn", (event) => warnings.push(event.message));
        con.client.addEventListener("message", (event) => messages.push(event.data));
    });

    it("warns when sending to a client that is not open", () => {
        con.send("hello");
        expect(warnings).toStrictEqual(["Cannot send: WebSocket not open"]);
    });

    it("warns when sending an invalid type", () => {
        con.accept();
        con.send({} as any);
        expect(warnings).toStrictEqual(["Cannot send: empty or invalid data"]);
    });
});
