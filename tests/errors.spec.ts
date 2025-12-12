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
    BadRequest,
    Forbidden,
    InternalServerError,
    MethodNotAllowed,
    MethodNotImplemented,
    NotFound,
    NotImplemented,
    PreconditionFailed,
    ServiceUnavailable,
    Unauthorized,
    UpgradeRequired,
} from "@src/errors";
import { ErrorJson } from "@src/interfaces/error";
import { StatusCodes } from "http-status-codes/build/es/status-codes";
import { getReasonPhrase } from "http-status-codes/build/es/utils-functions";
import { describe, expect, it, vi } from "vitest";

const worker = {
    request: { method: "POST" },
    getAllowedMethods: vi.fn(() => ["GET", "HEAD", "OPTIONS"]),
} as any;

describe("http error unit tests", () => {
    it.each([
        [BadRequest, StatusCodes.BAD_REQUEST, "Bad Request"],
        [Unauthorized, StatusCodes.UNAUTHORIZED, "Unauthorized"],
        [Forbidden, StatusCodes.FORBIDDEN, "Forbidden"],
        [NotFound, StatusCodes.NOT_FOUND, "Not Found"],
        [UpgradeRequired, StatusCodes.UPGRADE_REQUIRED, "Upgrade Required"],
        [InternalServerError, StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error"],
        [NotImplemented, StatusCodes.NOT_IMPLEMENTED, "Not Implemented"],
        [ServiceUnavailable, StatusCodes.SERVICE_UNAVAILABLE, "Service Unavailable"],
        [PreconditionFailed, StatusCodes.PRECONDITION_FAILED, "Precondition Failed"],
    ])("should return correct JSON for $2", (Ctor, status, reason) => {
        const err = new Ctor() as any;
        expect(err.status).toBe(status);
        expect(JSON.parse(err.body)).toEqual<ErrorJson>({
            status,
            error: reason,
            details: "",
        });
    });

    it("should include 'allow' header if method not allowed", () => {
        const err = new MethodNotAllowed(worker) as any;
        expect(err.status).toBe(StatusCodes.METHOD_NOT_ALLOWED);
        expect(JSON.parse(err.body)).toEqual<ErrorJson>({
            status: StatusCodes.METHOD_NOT_ALLOWED,
            error: getReasonPhrase(StatusCodes.METHOD_NOT_ALLOWED),
            details: "POST method not allowed.",
        });
        expect(err.headers.get("Allow")).toBe("GET, HEAD, OPTIONS");
    });

    it("should include method name in details if not implemented", () => {
        const err = new MethodNotImplemented(worker) as any;
        expect(err.status).toBe(StatusCodes.NOT_IMPLEMENTED);
        const parsed = JSON.parse(err.body as string);
        expect(parsed.details).toBe("POST method not implemented.");
    });
});
