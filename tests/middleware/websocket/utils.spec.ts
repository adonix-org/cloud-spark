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

import { WS_VERSION } from "@src/constants";
import {
    hasConnectionHeader,
    hasUpgradeHeader,
    hasWebSocketVersion,
} from "@src/middleware/websocket/utils";
import { describe, expect, it } from "vitest";

describe("websocket utils unit tests", () => {
    describe("has connection header function", () => {
        it("returns true when connection header contains 'upgrade'", () => {
            const headers = new Headers({ connection: "Upgrade" });
            expect(hasConnectionHeader(headers)).toBe(true);
        });

        it("returns true when connection header contains multiple values including 'upgrade'", () => {
            const headers = new Headers({ connection: "keep-alive, Upgrade" });
            expect(hasConnectionHeader(headers)).toBe(true);
        });

        it("returns false when connection header does not contain 'upgrade'", () => {
            const headers = new Headers({ connection: "keep-alive" });
            expect(hasConnectionHeader(headers)).toBe(false);
        });

        it("returns false when connection header is missing", () => {
            const headers = new Headers();
            expect(hasConnectionHeader(headers)).toBe(false);
        });
    });

    describe("has upgrade header function", () => {
        it("returns true when Upgrade header is 'websocket'", () => {
            const headers = new Headers({ upgrade: "websocket" });
            expect(hasUpgradeHeader(headers)).toBe(true);
        });

        it("returns true when Upgrade header has mixed casing", () => {
            const headers = new Headers({ upgrade: "WebSocket" });
            expect(hasUpgradeHeader(headers)).toBe(true);
        });

        it("returns false when Upgrade header is not 'websocket'", () => {
            const headers = new Headers({ upgrade: "h2c" });
            expect(hasUpgradeHeader(headers)).toBe(false);
        });

        it("returns false when Upgrade header is missing", () => {
            const headers = new Headers();
            expect(hasUpgradeHeader(headers)).toBe(false);
        });
    });

    describe("has websocket version function", () => {
        it("returns true when Sec-WebSocket-Version matches expected version", () => {
            const headers = new Headers({ "sec-websocket-version": WS_VERSION });
            expect(hasWebSocketVersion(headers)).toBe(true);
        });

        it("returns true when version header has extra whitespace", () => {
            const headers = new Headers({ "sec-websocket-version": `  ${WS_VERSION} ` });
            expect(hasWebSocketVersion(headers)).toBe(true);
        });

        it("returns false when Sec-WebSocket-Version does not match expected", () => {
            const headers = new Headers({ "sec-websocket-version": "12" });
            expect(hasWebSocketVersion(headers)).toBe(false);
        });

        it("returns false when Sec-WebSocket-Version is missing", () => {
            const headers = new Headers();
            expect(hasWebSocketVersion(headers)).toBe(false);
        });
    });
});
