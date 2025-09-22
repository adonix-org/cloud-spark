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

import { HttpHeader } from "../../constants";
import { WS_UPGRADE, WS_VERSION, WS_WEBSOCKET } from "../../constants/websocket";
import { getHeaderValues } from "../header";

export function createWebSocketPair(): [WebSocket, WebSocket] {
    const pair = new WebSocketPair() as { 0: WebSocket; 1: WebSocket };
    return [pair[0], pair[1]];
}

export function hasConnectionHeader(headers: Headers): boolean {
    return getHeaderValues(headers, HttpHeader.CONNECTION).some(
        (value) => value.toLowerCase() === WS_UPGRADE,
    );
}

export function hasUpgradeHeader(headers: Headers): boolean {
    return getHeaderValues(headers, HttpHeader.UPGRADE).some(
        (value) => value.toLowerCase() === WS_WEBSOCKET,
    );
}

export function hasWebSocketVersion(headers: Headers): boolean {
    return headers.get(HttpHeader.SEC_WEBSOCKET_VERSION)?.trim() === WS_VERSION;
}

export function toArrayBuffer(data: ArrayBuffer | ArrayBufferView): ArrayBuffer {
    const buffer = ArrayBuffer.isView(data) ? data.buffer : data;
    if (buffer instanceof ArrayBuffer) {
        return buffer;
    }
    throw new Error("Unexpected buffer type");
}
