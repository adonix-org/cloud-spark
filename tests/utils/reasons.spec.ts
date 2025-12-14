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

import { describe, expect, it } from "vitest";
import { StatusCodes } from "@src/constants";
import { getReasonPhrase } from "@src/utils/reasons";

describe("reasons function unit tests", () => {
    describe("get reason phrase function", () => {
        it("formats common success codes", () => {
            expect(getReasonPhrase(StatusCodes.OK)).toBe("Ok");
            expect(getReasonPhrase(StatusCodes.CREATED)).toBe("Created");
            expect(getReasonPhrase(StatusCodes.NO_CONTENT)).toBe("No Content");
        });

        it("formats redirect codes", () => {
            expect(getReasonPhrase(StatusCodes.MOVED_PERMANENTLY)).toBe("Moved Permanently");
            expect(getReasonPhrase(StatusCodes.FOUND)).toBe("Found");
            expect(getReasonPhrase(StatusCodes.NOT_MODIFIED)).toBe("Not Modified");
        });

        it("formats client error codes", () => {
            expect(getReasonPhrase(StatusCodes.BAD_REQUEST)).toBe("Bad Request");
            expect(getReasonPhrase(StatusCodes.UNAUTHORIZED)).toBe("Unauthorized");
            expect(getReasonPhrase(StatusCodes.FORBIDDEN)).toBe("Forbidden");
            expect(getReasonPhrase(StatusCodes.NOT_FOUND)).toBe("Not Found");
            expect(getReasonPhrase(StatusCodes.PRECONDITION_FAILED)).toBe("Precondition Failed");
        });

        it("formats server error codes", () => {
            expect(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)).toBe(
                "Internal Server Error",
            );
            expect(getReasonPhrase(StatusCodes.NOT_IMPLEMENTED)).toBe("Not Implemented");
            expect(getReasonPhrase(StatusCodes.SERVICE_UNAVAILABLE)).toBe("Service Unavailable");
        });

        it("returns stable output for all enum values", () => {
            for (const key of Object.keys(StatusCodes)) {
                if (!Number.isNaN(Number(key))) continue;

                const code = StatusCodes[key as keyof typeof StatusCodes];
                const phrase = getReasonPhrase(code);

                expect(phrase).toBeTypeOf("string");
                expect(phrase.length).toBeGreaterThan(0);
                expect(phrase).not.toContain("_");
            }
        });
    });
});
