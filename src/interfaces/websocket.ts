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

/**
 * Represents a warning event emitted by a WebSocket.
 */
export type WarnEvent = {
    type: "warn";
    message: string;
};

/**
 * Map of custom WebSocket events.
 * - `warn`: internal warning notifications
 * - `open`: triggered when the WebSocket is accepted
 */
export type CustomEventMap = {
    warn: WarnEvent;
    open: Event;
};

/** Options for registering WebSocket event listeners. */
export type EventOptions = { once?: boolean };

/** Names of custom WebSocket events (`warn`, `open`). */
export type CustomEventType = keyof CustomEventMap;

/** Map of all events, combining native WebSocket events and custom events. */
export type ExtendedEventMap = WebSocketEventMap & CustomEventMap;

/** Names of all events, including standard and custom WebSocket events. */
export type ExtendedEventType = keyof ExtendedEventMap;

/** Event listener type for an extended WebSocket event. */
export type ExtendedEventListener<K extends ExtendedEventType> = (ev: ExtendedEventMap[K]) => void;

/**
 * Represents a user-defined attachment object that can be associated with a WebSocket connection.
 */
export type WSAttachment = object;

/**
 * Represents a managed WebSocket connection with typed attachment and extended event support.
 *
 * @template A - Type of the attachment object associated with this connection.
 */
export interface WebSocketConnection<A extends WSAttachment> {
    /**
     * Current readyState of the WebSocket (0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED).
     */
    get readyState(): number;

    /**
     * Checks whether the WebSocket is currently in one of the provided states.
     *
     * @param states - List of WebSocket readyState values to check against.
     * @returns `true` if the WebSocket's readyState matches any of the provided states.
     */
    isState(...states: number[]): boolean;

    /**
     * Accepts the WebSocket connection if not already accepted.
     *
     * @returns The readonly native WebSocket instance.
     */
    accept(): Readonly<WebSocket>;

    /**
     * Accepts the WebSocket connection in the context of a Durable Object.
     * Optionally associates tags for filtering.
     *
     * @param ctx - DurableObjectState for the WebSocket.
     * @param tags - Optional list of string tags.
     * @returns The readonly native WebSocket instance.
     */
    acceptWebSocket(ctx: DurableObjectState, tags?: string[]): Readonly<WebSocket>;

    /**
     * Retrieves the user-defined attachment object associated with this connection.
     *
     * The returned object is a read-only view of the attachment to prevent
     * accidental mutation. To modify the attachment, call {@link attach}.
     *
     * @returns A read-only view of the current attachment.
     */
    get attachment(): Readonly<A>;

    /**
     * Attaches a user-defined object to this WebSocket connection.
     *
     * @param attachment - Object containing the metadata to attach.
     */
    attach(attachment: A): void;

    /**
     * Sends a message to the connected WebSocket client.
     *
     * @param message - Message to send, either string or binary data.
     */
    send(message: string | ArrayBuffer): void;

    /**
     * Closes the WebSocket connection with an optional code and reason.
     *
     * @param code - Close code (default is `1000` NORMAL).
     * @param reason - Optional reason string (sanitized to valid characters).
     */
    close(code?: number, reason?: string): void;

    /**
     * Registers an event listener for a WebSocket event.
     *
     * Supports both standard WebSocket events (`message`, `close`, etc.)
     * and custom events (`open`, `warn`).
     *
     * @param type - Event type to listen for.
     * @param listener - Callback invoked when the event occurs.
     * @param options - Optional event listener options (`once`).
     */
    addEventListener<K extends ExtendedEventType>(
        type: K,
        listener: ExtendedEventListener<K>,
        options?: EventOptions,
    ): void;

    /**
     * Removes a previously registered WebSocket event listener.
     *
     * Works for both standard and custom events.
     *
     * @param type - Event type to remove.
     * @param listener - Listener function to remove.
     */
    removeEventListener<K extends ExtendedEventType>(
        type: K,
        listener: ExtendedEventListener<K>,
    ): void;
}
