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

import {
    CustomEventType,
    EventOptions,
    ExtendedEventListener,
    ExtendedEventMap,
    ExtendedEventType,
} from "../interfaces/websocket";

/**
 * Base class for managing WebSocket events, including both standard WebSocket events
 * and internal custom events (`open` and `warn`).
 *
 * This class wraps a native WebSocket instance (`server`) and provides:
 * - Delegation of standard events (`message`, `close`, etc.)
 * - Support for custom events used internally by the library:
 *   - `open`: dispatched once when the connection is accepted
 *   - `warn`: dispatched whenever a warning occurs
 *
 * Subclasses can call `warn()` or `open()` to trigger custom events.
 */
export abstract class WebSocketEvents {
    /** The underlying WebSocket server instance being wrapped. */
    protected readonly server: WebSocket;

    /** Internal map of custom event listeners. */
    private customListeners: {
        [K in ExtendedEventType]?: ((ev: ExtendedEventMap[K]) => void)[];
    } = {};

    /**
     * @param server - The native WebSocket instance to wrap.
     */
    constructor(server: WebSocket) {
        this.server = server;
    }

    /**
     * Adds an event listener for either a standard WebSocket event or a custom event.
     *
     * - Custom events: `open`, `warn`
     * - Standard events: `message`, `close`, `error`, etc.
     *
     * The `close` event is automatically set to `{ once: true }` if no options are provided.
     *
     * @param type - Event type to listen for.
     * @param listener - Callback invoked when the event occurs.
     * @param options - Optional event options (`once`).
     */
    public addEventListener<K extends ExtendedEventType>(
        type: K,
        listener: ExtendedEventListener<K>,
        options?: EventOptions,
    ): void {
        if (WebSocketEvents.isCustomEvent(type)) {
            let arr = this.customListeners[type];
            if (!arr) {
                arr = [];
                this.customListeners[type] = arr;
            }
            arr.push(listener);
        } else {
            const finalOptions = type === "close" ? { ...options, once: true } : options;
            this.server.addEventListener(
                type as keyof WebSocketEventMap,
                listener as EventListener,
                finalOptions,
            );
        }
    }

    /**
     * Removes a previously registered event listener.
     *
     * Works for both standard WebSocket events and custom events.
     *
     * @param type - Event type to remove.
     * @param listener - Listener function to remove.
     */
    public removeEventListener<K extends ExtendedEventType>(
        type: K,
        listener: ExtendedEventListener<K>,
    ): void {
        if (WebSocketEvents.isCustomEvent(type)) {
            const arr = this.customListeners[type];
            if (arr) {
                const index = arr.indexOf(listener);
                if (index !== -1) arr.splice(index, 1);
            }
        } else {
            this.server.removeEventListener(
                type as keyof WebSocketEventMap,
                listener as EventListener,
            );
        }
    }

    /**
     * Dispatches a custom event to all registered listeners.
     *
     * @param type - The custom event type (`open` or `warn`).
     * @param ev - Event object to pass to listeners.
     * @param once - If `true`, all listeners for this event are removed after dispatch.
     */
    private dispatch<K extends CustomEventType>(
        type: K,
        ev: ExtendedEventMap[K],
        once: boolean = false,
    ): void {
        const listeners = this.customListeners[type]?.slice() ?? [];
        if (once) {
            this.customListeners[type] = [];
        }
        for (const listener of listeners) {
            listener(ev);
        }
    }

    /**
     * Dispatches a `warn` event with a given message.
     *
     * Intended for internal use to notify listeners of warnings.
     *
     * @param msg - Warning message to emit.
     */
    protected warn(msg: string) {
        this.dispatch("warn", { type: "warn", message: msg });
    }

    /**
     * Dispatches an `open` event.
     *
     * Intended to signal that the WebSocket has been accepted and is ready.
     * This event is dispatched only once.
     */
    protected open() {
        this.dispatch("open", new Event("open"), true);
    }

    /** Internal helper to determine if an event is a custom event. */
    private static isCustomEvent(type: ExtendedEventType): boolean {
        return ["open", "warn"].includes(type);
    }
}
