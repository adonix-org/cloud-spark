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

import { CloseCode } from "../../constants/websocket";

/** WebSocket upgrade header value */
export const WS_UPGRADE = "upgrade";
/** WebSocket protocol header value */
export const WS_WEBSOCKET = "websocket";
/** WebSocket protocol version */
export const WS_VERSION = "13";
/** Max close code a user can send */
export const WS_MAX_CLOSE_CODE = 4999;
/** Max number of reason chars a user can send */
export const WS_MAX_REASON_CHARS = 123;

/** WebSocket RESERVED close codes */
export const WS_RESERVED_CODES = new Set<number>([
    CloseCode.NO_STATUS,
    CloseCode.ABNORMAL,
    CloseCode.TLS_HANDSHAKE,
]);
