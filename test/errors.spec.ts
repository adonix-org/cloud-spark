import { describe, it, expect } from "vitest";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import {
    BadRequest,
    Unauthorized,
    Forbidden,
    NotFound,
    MethodNotAllowed,
    InternalServerError,
    NotImplemented,
    MethodNotImplemented,
    ServiceUnavailable,
    ErrorJson,
} from "../src/errors";

const worker = {
    request: { method: "POST" },
    getAllowMethods: () => "GET, HEAD, OPTIONS",
} as any;

describe("http error unit tests", () => {
    it.each([
        [BadRequest, StatusCodes.BAD_REQUEST, "Bad Request"],
        [Unauthorized, StatusCodes.UNAUTHORIZED, "Unauthorized"],
        [Forbidden, StatusCodes.FORBIDDEN, "Forbidden"],
        [NotFound, StatusCodes.NOT_FOUND, "Not Found"],
        [InternalServerError, StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error"],
        [NotImplemented, StatusCodes.NOT_IMPLEMENTED, "Not Implemented"],
        [ServiceUnavailable, StatusCodes.SERVICE_UNAVAILABLE, "Service Unavailable"],
    ])("should return correct JSON for $2", (Ctor, status, reason) => {
        const err = new Ctor(worker) as any;
        expect(err.status).toBe(status);
        expect(JSON.parse(err.body)).toEqual<ErrorJson>({
            status,
            error: reason,
            details: reason,
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
