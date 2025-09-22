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

type WarnEvent = { type: "warn"; message: string };

type CustomEventMap = {
    warn: WarnEvent;
    open: Event;
};
type ExtendedEventMap = WebSocketEventMap & CustomEventMap;
type CustomeEventType = keyof CustomEventMap;
type ExtendedEventType = keyof ExtendedEventMap;

type EventOptions = { once?: boolean };

function isCustom(type: ExtendedEventType): boolean {
    return type === "warn" || type === "open";
}

export abstract class ServerWebSocketEvents {
    readonly #server: WebSocket;

    private customListeners: {
        [K in ExtendedEventType]?: ((ev: ExtendedEventMap[K]) => void)[];
    } = {};

    constructor(server: WebSocket) {
        this.#server = server;
    }

    public addEventListener<K extends ExtendedEventType>(
        type: K,
        listener: (ev: ExtendedEventMap[K]) => void,
        options?: EventOptions,
    ): void {
        if (isCustom(type)) {
            let arr = this.customListeners[type];
            if (!arr) {
                arr = [];
                this.customListeners[type] = arr;
            }

            if (options?.once) {
                const wrapped = (ev: ExtendedEventMap[typeof type]) => {
                    this.removeEventListener(type, wrapped);
                    listener(ev);
                };
                arr.push(wrapped);
            } else {
                arr.push(listener);
            }
        } else {
            this.#server.addEventListener(
                type as keyof WebSocketEventMap,
                listener as any,
                options,
            );
        }
    }

    public removeEventListener<K extends ExtendedEventType>(
        type: K,
        listener: (ev: ExtendedEventMap[K]) => void,
    ): void {
        if (isCustom(type)) {
            const arr = this.customListeners[type];
            if (arr) {
                this.customListeners[type] = arr.filter((l) => l !== listener) as any;
            }
        } else {
            this.#server.removeEventListener(type as keyof WebSocketEventMap, listener as any);
        }
    }

    private dipatch<K extends CustomeEventType>(type: K, ev: ExtendedEventMap[K]) {
        this.customListeners[type]?.slice().forEach((listener) => listener(ev));
    }

    protected warn(msg: string) {
        this.dipatch("warn", { type: "warn", message: msg });
    }

    protected open() {
        this.dipatch("open", new Event("open"));
    }
}
