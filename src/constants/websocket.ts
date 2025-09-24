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

/** WebSocket upgrade header value */
export const WS_UPGRADE = "upgrade";
/** WebSocket protocol header value */
export const WS_WEBSOCKET = "websocket";
/** WebSocket protocol version */
export const WS_VERSION = "13";
/** Max close code a user can send */
export const WS_MAX_CLOSE_CODE = 4999;

/** WebSocket close codes */
export const CloseCode = {
    NORMAL: 1000,
    GOING_AWAY: 1001,
    PROTOCOL_ERROR: 1002,
    UNSUPPORTED_DATA: 1003,
    NO_STATUS: 1005,
    ABNORMAL: 1006,
    INVALID_PAYLOAD: 1007,
    POLICY_VIOLATION: 1008,
    MESSAGE_TOO_BIG: 1009,
    MISSING_EXTENSION: 1010,
    INTERNAL_ERROR: 1011,
    TLS_HANDSHAKE: 1015,
} as const;

export const WS_RESERVED_CODES = new Set<number>([
    CloseCode.NO_STATUS,
    CloseCode.ABNORMAL,
    CloseCode.TLS_HANDSHAKE,
]);
