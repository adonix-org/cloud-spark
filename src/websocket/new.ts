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

import { BaseWebSocket } from "./base";

/**
 * Internal base for managing a new WebSocket connection.
 *
 * - Creates a WebSocket pair and stores the client side internally.
 * - Provides methods to accept the server WebSocket and retrieve the client.
 * - Ensures the `open` event is dispatched when the connection is accepted.
 * - Tracks whether the connection has already been accepted to prevent multiple acceptances.
 *
 * @template A - Type of the attachment object for this connection.
 */
export abstract class NewConnectionBase<A extends WSAttachment>
    extends BaseWebSocket<A>
    implements WebSocketConnection<A>
{
    /** The client-facing end of the WebSocket pair. */
    private readonly client: WebSocket;

    /**
     * Creates a new WebSocket pair and initializes the server side.
     *
     * The client side is stored internally and returned upon acceptance.
     */
    public constructor() {
        const pair = new WebSocketPair();
        const [client, server] = [pair[0], pair[1]];
        super(server);
        this.client = client;
    }

    /**
     * Accepts the server WebSocket and returns the client WebSocket.
     *
     * If already accepted, returns the existing client WebSocket.
     * Otherwise, uses a Durable Object state to accept the connection
     * and marks it as ready.
     *
     * @param ctx - DurableObjectState used to accept the WebSocket.
     * @param tags - Optional array of tags to attach to the WebSocket.
     * @returns Readonly client WebSocket ready for use.
     */
    public acceptWebSocket(ctx: DurableObjectState, tags?: string[]): Readonly<WebSocket> {
        if (this.accepted) return this.client;
        ctx.acceptWebSocket(this.server, tags);
        return this.ready();
    }

    /**
     * Accepts the server WebSocket and returns the client WebSocket.
     *
     * If already accepted, returns the existing client WebSocket.
     * Otherwise, calls the internal server accept method and marks
     * the connection as ready.
     *
     * @returns Readonly client WebSocket ready for use.
     */
    public accept(): Readonly<WebSocket> {
        if (this.accepted) return this.client;
        this.server.accept();
        return this.ready();
    }

    /**
     * Marks the WebSocket connection as ready.
     *
     * Sets the accepted flag, dispatches the `open` event,
     * and returns the client WebSocket.
     *
     * @returns Client WebSocket ready for use.
     */
    private ready(): WebSocket {
        this.accepted = true;
        this.open();

        return this.client;
    }
}
