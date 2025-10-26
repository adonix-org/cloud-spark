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

/**
 * Manages active WebSocket connections in a Cloudflare Workers environment.
 *
 * Provides a simple interface for creating, restoring, and managing
 * WebSocket connections with optional attachments. Users can:
 *
 * - Create new WebSocket connections (`create`) and attach arbitrary data.
 * - Accept connections using the standard WebSocket API (`accept`).
 * - Accept connections using the hibernatable WebSocket API (`acceptWebSocket`),
 *   which allows the connection to be put to sleep when inactive.
 * - Restore existing WebSockets into a managed session (`restore`, `restoreAll`),
 *   maintaining their hibernation state.
 * - Iterate over active connections or retrieve a connection by its WebSocket instance.
 * - Close a connection cleanly with optional code and reason (`close`).
 *
 * @template A - Type of attachment data stored on each WebSocket connection.
 */
export class WebSocketSessions<A extends WSAttachment = WSAttachment> {
    /** @internal Map of active WebSocket to their connection wrapper. */
    private readonly map = new Map<WebSocket, WebSocketConnection<A>>();

    /**
     * Create a new WebSocket connection and optionally attach user data.
     *
     * @param attachment - Partial attachment object to initialize the connection with.
     * @returns A `WebSocketConnection` instance ready for accepting and sending messages.
     */
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

    /**
     * Wraps an existing WebSocket in a managed connection session.
     *
     * @param ws - An existing WebSocket to restore.
     * @returns A `WebSocketConnection` representing the restored session.
     */
    public restore(ws: WebSocket): WebSocketConnection<A> {
        class RestoredConnection extends RestoredConnectionBase<A> {
            constructor(sessions: WebSocketSessions<A>, restore: WebSocket) {
                super(restore);
                sessions.register(this.server, this);
            }
        }
        return new RestoredConnection(this, ws);
    }

    /**
     * Restores multiple WebSockets into managed sessions at once.
     *
     * @param all - Array of WebSocket instances to restore.
     * @returns Array of `WebSocketConnections` restored.
     */
    public restoreAll(all: WebSocket[]): ReadonlyArray<WebSocketConnection<A>> {
        const restored: WebSocketConnection<A>[] = [];
        for (const ws of all) {
            restored.push(this.restore(ws));
        }
        return restored;
    }

    /**
     * Retrieves the managed connection for a specific WebSocket, if any.
     *
     * @param ws - WebSocket instance.
     * @returns Corresponding `WebSocketConnection` or `undefined` if not managed.
     */
    public get(ws: WebSocket): WebSocketConnection<A> | undefined {
        return this.map.get(ws);
    }

    /**
     * Selects the managed `WebSocketConnection` objects corresponding to the given WebSockets.
     *
     * @param sockets - Array of WebSocket instances to resolve.
     * @returns Array of corresponding `WebSocketConnection` objects.
     */
    public select(sockets: WebSocket[]): WebSocketConnection<A>[] {
        const result: WebSocketConnection<A>[] = [];
        for (const ws of sockets) {
            const conn = this.map.get(ws);
            if (conn) result.push(conn);
        }
        return result;
    }

    /**
     * Returns an iterator over all active `WebSocketConnection` objects
     * managed by this session.
     *
     * Useful for iterating over all connections to perform actions such as
     * broadcasting messages.
     *
     * @returns Iterable iterator of all active `WebSocketConnection` objects.
     */
    public values(): IterableIterator<WebSocketConnection<A>> {
        return this.map.values();
    }

    /**
     * Returns an iterator over all active raw `WebSocket` instances
     * currently tracked by this session.
     *
     * @returns Iterable iterator of all active `WebSocket` instances.
     */
    public keys(): IterableIterator<WebSocket> {
        return this.map.keys();
    }

    /**
     * Closes a managed WebSocket connection with optional code and reason.
     *
     * @param ws - WebSocket to close.
     * @param code - Optional WebSocket close code.
     * @param reason - Optional reason string.
     * @returns `true` if the connection was managed and removed, `false` otherwise.
     */
    public close(ws: WebSocket, code?: number, reason?: string): boolean {
        const con = this.get(ws);
        if (con) con.close(code, reason);

        return this.unregister(ws);
    }

    /** Iterates over all active WebSocket connections. */
    public *[Symbol.iterator](): IterableIterator<WebSocketConnection<A>> {
        yield* this.values();
    }

    /** Registers a connection internally. */
    private register(ws: WebSocket, con: WebSocketConnection<A>): void {
        this.map.set(ws, con);
    }

    /** Unregisters a connection internally. */
    private unregister(ws: WebSocket): boolean {
        return this.map.delete(ws);
    }
}
