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

import { WebSocketConnection, WSAttachment } from "../interfaces/websocket";

import { NewConnectionBase } from "./new";
import { RestoredConnectionBase } from "./restore";

export class WebSocketSessions<A extends WSAttachment = WSAttachment> {
    private readonly map = new Map<WebSocket, WebSocketConnection<A>>();

    public create(attachment?: Partial<A>): WebSocketConnection<A> {
        class NewConnection extends NewConnectionBase<A> {
            constructor(private readonly sessions: WebSocketSessions<A>) {
                super();
            }

            public override accept(): WebSocket {
                this.addEventListener("close", () => this.sessions.unregister(this.server));
                this.sessions.register(this.server, this);
                return super.accept();
            }

            public override acceptWebSocket(ctx: DurableObjectState, tags?: string[]): WebSocket {
                this.sessions.register(this.server, this);
                return super.acceptWebSocket(ctx, tags);
            }
        }

        const connection = new NewConnection(this);
        connection.attach(attachment);
        return connection;
    }

    public restore(ws: WebSocket): WebSocketConnection<A> {
        class RestoredConnection extends RestoredConnectionBase<A> {
            constructor(sessions: WebSocketSessions<A>, restore: WebSocket) {
                super(restore);
                sessions.register(this.server, this);
            }
        }
        return new RestoredConnection(this, ws);
    }

    public restoreAll(all: WebSocket[]): ReadonlyArray<WebSocketConnection<A>> {
        const restored: WebSocketConnection<A>[] = [];
        for (const ws of all) {
            restored.push(this.restore(ws));
        }
        return restored;
    }

    public get(ws: WebSocket): WebSocketConnection<A> | undefined {
        return this.map.get(ws);
    }

    public values(): IterableIterator<WebSocketConnection<A>> {
        return this.map.values();
    }

    public keys(): IterableIterator<WebSocket> {
        return this.map.keys();
    }

    public close(ws: WebSocket, code?: number, reason?: string): boolean {
        const con = this.get(ws);
        if (con) con.close(code, reason);

        return this.unregister(ws);
    }

    public *[Symbol.iterator](): IterableIterator<WebSocketConnection<A>> {
        yield* this.values();
    }

    private register(ws: WebSocket, con: WebSocketConnection<A>): void {
        this.map.set(ws, con);
    }

    private unregister(ws: WebSocket): boolean {
        return this.map.delete(ws);
    }
}
