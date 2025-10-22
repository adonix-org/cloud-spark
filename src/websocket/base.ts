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

import { assertSerializable, isSendable } from "../guards/websocket";
import { WSAttachment } from "../interfaces/websocket";

import { WebSocketEvents } from "./events";
import { safeCloseCode, safeReason } from "./utils";

/**
 * Base class providing core WebSocket functionality and attachment management.
 *
 * Extends `WebSocketEvents` to inherit custom event handling.
 *
 * @template A - Type of the attachment object associated with this WebSocket.
 */
export abstract class BaseWebSocket<A extends WSAttachment> extends WebSocketEvents {
    /** Tracks whether the WebSocket has been accepted. */
    protected accepted = false;

    /** The underlying WebSocket server instance. */
    protected readonly server: WebSocket;

    /**
     * Initializes the base WebSocket wrapper.
     *
     * Registers a listener to handle the underlying WebSocket `close` event.
     *
     * @param server - The underlying WebSocket instance.
     */
    constructor(server: WebSocket) {
        super(server);
        this.server = server;
        this.server.addEventListener("close", this.onclose);
    }

    /**
     * Sends a message over the WebSocket if it is open.
     *
     * Performs validation to ensure the WebSocket is in an open state
     * and the data is non-empty and sendable. Emits a warning if not.
     *
     * @param data - The message to send, as a string or binary data.
     */
    public send(data: string | ArrayBuffer | ArrayBufferView): void {
        if (this.isState(WebSocket.CONNECTING, WebSocket.CLOSED)) {
            this.warn("Cannot send: WebSocket not open");
            return;
        }
        if (!isSendable(data)) {
            this.warn("Cannot send: empty or invalid data");
            return;
        }

        this.server.send(data);
    }

    /**
     * Returns the current attachment associated with this WebSocket.
     *
     * Attachments are stored as serialized objects on the underlying WebSocket.
     *
     * @returns Readonly attachment object of type `A`.
     */
    public get attachment(): Readonly<A> {
        return (this.server.deserializeAttachment() ?? {}) as A;
    }

    /**
     * Updates the attachment object for this WebSocket.
     *
     * Merges the provided partial attachment with the current attachment,
     * ensures it is serializable, and stores it on the underlying WebSocket.
     *
     * @param attachment - Partial or full attachment object to store,
     *                     or `null` to clear the attachment.
     */
    public attach(attachment?: Partial<A> | null): void {
        if (attachment === undefined) return;
        if (attachment === null) {
            this.server.serializeAttachment({});
        } else {
            const current = this.attachment;
            const merged = { ...current, ...attachment };
            assertSerializable(merged);
            this.server.serializeAttachment(merged);
        }
    }

    /**
     * Returns the current WebSocket ready state.
     *
     * If the WebSocket has not been accepted, returns `WebSocket.CONNECTING`.
     *
     * @returns The ready state of the WebSocket.
     */
    public get readyState(): number {
        if (!this.accepted) return WebSocket.CONNECTING;
        return this.server.readyState;
    }

    /**
     * Checks if the current ready state matches any of the provided states.
     *
     * @param states - One or more WebSocket state constants to check.
     * @returns `true` if the current state matches any provided, `false` otherwise.
     */
    public isState(...states: number[]): boolean {
        return states.includes(this.readyState);
    }

    /**
     * Closes the WebSocket safely.
     *
     * Removes the internal `close` listener and closes the underlying WebSocket
     * using validated close code and sanitized reason.
     *
     * @param code - Optional WebSocket close code.
     * @param reason - Optional reason for closing the WebSocket.
     */
    public close(code?: number, reason?: string): void {
        this.server.removeEventListener("close", this.onclose);
        this.server.close(safeCloseCode(code), safeReason(reason));
    }

    /** Internal handler for the underlying WebSocket `close` event. */
    private readonly onclose = (event: CloseEvent): void => {
        this.close(event.code, event.reason);
    };
}
