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
import { describe, it, expect, beforeEach } from "vitest";

interface Id {
    id: string;
    value: number;
}

class TestConnection extends BaseWebSocket {
    public readonly client: WebSocket;

    constructor() {
        const pair = new WebSocketPair();
        const [client, server] = [pair[0], pair[1]];
        super(server);
        this.client = client;
    }

    public count = 0;
    public override close(code?: number, reason?: string): void {
        this.count++;
        super.close(code, reason);
    }

    public getWs(): WebSocket {
        return this.server;
    }

    public getAccepted() {
        return this.accepted;
    }

    public accept(): void {
        this.accepted = true;
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

    it("can send a message to the client", () => {
        con.accept();
        con.send("hello");
        expect(warnings).toStrictEqual([]);
        expect(messages).toStrictEqual(["hello"]);
    });

    it("sets an attachment on the wrapped websocket", () => {
        con.setAttachment<Id>({
            id: "123",
            value: 456,
        });

        const attachment = con.getAttachment<Id>();
        expect(attachment.id).toBe("123");
        expect(attachment.value).toBe(456);
    });

    it("returns 'connecting' for ready state when accepted = false", () => {
        expect(con.getAccepted()).toBe(false);
        expect(con.readyState).toBe(WebSocket.CONNECTING);
    });

    it("rreturns 'open' for ready state when accepted = true", () => {
        expect(con.getAccepted()).toBe(false);
        con.accept();
        expect(con.getAccepted()).toBe(true);
        expect(con.readyState).toBe(WebSocket.OPEN);
    });

    it("returns false for mismatched ready state", () => {
        expect(con.readyState).toBe(WebSocket.CONNECTING);
        expect(con.isState(WebSocket.OPEN)).toBe(false);
    });

    it("returns false for mismatched ready states", () => {
        expect(con.readyState).toBe(WebSocket.CONNECTING);
        expect(con.isState(WebSocket.OPEN, WebSocket.CLOSED, WebSocket.CLOSING)).toBe(false);
    });

    it("returns true for matched ready state", () => {
        expect(con.readyState).toBe(WebSocket.CONNECTING);
        expect(con.isState(WebSocket.CONNECTING)).toBe(true);
    });

    it("returns true for any matched ready state", () => {
        expect(con.readyState).toBe(WebSocket.CONNECTING);
        expect(con.isState(WebSocket.OPEN, WebSocket.CONNECTING, WebSocket.CLOSED)).toBe(true);
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

    it("calls close on wrapped websocket", () => {
        con.accept();
        expect(con.readyState).toBe(WebSocket.OPEN);
        expect(con.getWs().readyState).toBe(WebSocket.OPEN);

        con.close();
        expect(con.readyState).toBe(WebSocket.CLOSED);
        expect(con.getWs().readyState).toBe(WebSocket.CLOSED);
    });

    it("receives close from client websocket", () => {
        con.accept();

        con.client.close();

        expect(con.readyState).toBe(WebSocket.CLOSED);
        expect(con.getWs().readyState).toBe(WebSocket.CLOSED);
    });

    it("passes close code and reason from client close", async () => {
        con.accept();

        await new Promise<void>((resolve) => {
            con.addEventListener("close", (event) => {
                expect(event.code).toBe(1001);
                expect(event.reason).toBe("a reason");
                resolve();
            });
            con.client.close(1001, "a reason");
        });
    });

    it("only fires close event once on client close", async () => {
        con.accept();

        let count = 0;
        await new Promise<void>((resolve) => {
            con.addEventListener("close", () => {
                count++;
                resolve();
            });
            con.client.close();
        });

        expect(count).toBe(1);
    });

    it("only fires close event once on server close", async () => {
        con.accept();

        let count = 0;
        await new Promise<void>((resolve) => {
            con.addEventListener("close", () => {
                count++;
                resolve();
            });
            con.close();
        });

        expect(count).toBe(1);
    });

    it("only calls close once on client close", async () => {
        con.accept();
        con.client.close();
        expect(con.count).toBe(1);
    });
});
