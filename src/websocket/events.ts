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

export abstract class WebSocketEvents {
    protected readonly server: WebSocket;

    private static isCustomEvent(type: ExtendedEventType): boolean {
        return ["open", "warn"].includes(type);
    }

    private customListeners: {
        [K in ExtendedEventType]?: ((ev: ExtendedEventMap[K]) => void)[];
    } = {};

    constructor(server: WebSocket) {
        this.server = server;
    }

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

    private dispatch<K extends CustomEventType>(
        type: K,
        ev: ExtendedEventMap[K],
        once: boolean = false,
    ): void {
        const listeners = this.customListeners[type]?.slice() ?? [];
        if (once) {
            this.customListeners[type] = [];
        }
        listeners.forEach((listener) => listener(ev));
    }

    protected warn(msg: string) {
        this.dispatch("warn", { type: "warn", message: msg });
    }

    protected open() {
        this.dispatch("open", new Event("open"), true);
    }
}
