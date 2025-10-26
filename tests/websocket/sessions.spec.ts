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
import { WebSocketSessions } from "@src/websocket/sessions";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("websocket sessions unit tests", () => {
    let sessions: WebSocketSessions;

    beforeEach(() => {
        sessions = new WebSocketSessions();
        vi.clearAllMocks();
    });

    it("creates and registers a new connection", () => {
        const con = sessions.create();
        con.accept();

        const allKeys = [...sessions.keys()];
        const allValues = [...sessions.values()];

        expect(allValues).toContain(con);
        expect(allKeys).toHaveLength(1);

        const ws = allKeys[0];
        expect(sessions.get(ws!)).toBe(con);
    });

    it("creates and registers a new hibernate-enabled connection", () => {
        const mockCtx: DurableObjectState = {
            acceptWebSocket: vi.fn(() => 0),
        } as unknown as DurableObjectState;

        const con = sessions.create();
        con.acceptWebSocket(mockCtx);

        const allKeys = [...sessions.keys()];
        const allValues = [...sessions.values()];

        expect(allValues).toContain(con);
        expect(allKeys).toHaveLength(1);
        expect(mockCtx.acceptWebSocket).toHaveBeenCalledOnce();

        const ws = allKeys[0];
        expect(sessions.get(ws!)).toBe(con);
    });

    it("restores a single websocket with restore", () => {
        const ws = new MockWebSocket();
        const con = sessions.restore(ws);

        expect([...sessions.values()]).toContain(con);
        expect([...sessions.keys()]).toContain(ws);
        expect(sessions.get(ws)).toBe(con);
    });

    it("selects multiple websockets with select", () => {
        for (let i = 0; i < 10; i++) {
            const con = sessions.create();
            con.accept();
        }

        const keys = [...sessions.keys()];
        expect(keys.length).toBe(10);

        const subset = sessions.select(keys.slice(0, 5));
        expect(subset.length).toBe(5);

        for (let i = 0; i < subset.length; i++) {
            expect(sessions.get(keys[i]!)).toBe(subset[i]);
        }
    });

    it("restores multiple websockets with restore all", () => {
        const ws1 = new MockWebSocket();
        const ws2 = new MockWebSocket();

        const restored = sessions.restoreAll([ws1, ws2]);

        expect(restored).toHaveLength(2);
        for (const con of restored) {
            expect([...sessions.values()]).toContain(con);
        }
        expect(sessions.get(ws1)).toBe(restored[0]);
        expect(sessions.get(ws2)).toBe(restored[1]);
        expect([...sessions.keys()]).toEqual(expect.arrayContaining([ws1, ws2]));
    });

    it("closes a 'new' websocket and unregisters it", () => {
        const con = sessions.create();
        con.accept();

        expect([...sessions.values()].length).toBe(1);

        con.close(1000, "goodbye");

        expect([...sessions.values()].length).toBe(0);
    });

    it("closes a 'restored' websocket and unregisters it", () => {
        const ws = new MockWebSocket();
        const con = sessions.restore(ws);

        expect(sessions.get(ws)).toBe(con);

        const result = sessions.close(ws, 1000, "goodbye");

        expect(result).toBe(true);
        expect(sessions.get(ws)).toBeUndefined();
    });

    it("iterates over connections using symbol.iterator", () => {
        const con1 = sessions.create();
        const con2 = sessions.create();

        con1.accept();
        con2.accept();

        const iterated = [...sessions];

        expect(iterated).toHaveLength(2);
        expect(iterated).toContain(con1);
        expect(iterated).toContain(con2);
        expect(iterated).toEqual([...sessions.values()]);
    });
});
