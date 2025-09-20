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

import { getReasonPhrase, StatusCodes } from "http-status-codes";
import { JsonResponse } from "./responses";
import { ErrorJson } from "./interfaces/error-json";
import { Worker } from "./interfaces/worker";
import { CacheControl } from "./constants/cache";
import { HttpHeader } from "./constants/http";
import { assertMethods } from "./guards";
import { WS_VERSION } from "./constants/websocket";

/**
 * Generic HTTP error response.
 * Sends a JSON body with status, error message, and details.
 */
export class HttpError extends JsonResponse {
    /**
     * @param worker The worker handling the request.
     * @param status HTTP status code.
     * @param details Optional detailed error message.
     */
    constructor(
        status: StatusCodes,
        protected readonly details?: string,
    ) {
        const json: ErrorJson = {
            status,
            error: getReasonPhrase(status),
            details: details ?? "",
        };
        super(json, CacheControl.DISABLE, status);
    }
}

/** 400 Bad Request error response. */
export class BadRequest extends HttpError {
    constructor(details?: string) {
        super(StatusCodes.BAD_REQUEST, details);
    }
}

/** 401 Unauthorized error response. */
export class Unauthorized extends HttpError {
    constructor(details?: string) {
        super(StatusCodes.UNAUTHORIZED, details);
    }
}

/** 403 Forbidden error response. */
export class Forbidden extends HttpError {
    constructor(details?: string) {
        super(StatusCodes.FORBIDDEN, details);
    }
}

/** 404 Not Found error response. */
export class NotFound extends HttpError {
    constructor(details?: string) {
        super(StatusCodes.NOT_FOUND, details);
    }
}

/** 405 Method Not Allowed error response. */
export class MethodNotAllowed extends HttpError {
    constructor(worker: Worker) {
        const methods = worker.getAllowedMethods();
        assertMethods(methods);

        super(StatusCodes.METHOD_NOT_ALLOWED, `${worker.request.method} method not allowed.`);
        this.setHeader(HttpHeader.ALLOW, methods);
    }
}

/** 426 Upgrade Required error response. */
export class UpgradeRequired extends HttpError {
    constructor() {
        super(StatusCodes.UPGRADE_REQUIRED);
        this.headers.set(HttpHeader.SEC_WEBSOCKET_VERSION, WS_VERSION);
    }
}

/** 500 Internal Server Error response. */
export class InternalServerError extends HttpError {
    constructor(details?: string) {
        super(StatusCodes.INTERNAL_SERVER_ERROR, details);
    }
}

/** 501 Not Implemented error response. */
export class NotImplemented extends HttpError {
    constructor(details?: string) {
        super(StatusCodes.NOT_IMPLEMENTED, details);
    }
}

/** 501 Method Not Implemented error response for unsupported HTTP methods. */
export class MethodNotImplemented extends NotImplemented {
    constructor(worker: Worker) {
        super(`${worker.request.method} method not implemented.`);
    }
}

/** 503 Service Unavailable error response. */
export class ServiceUnavailable extends HttpError {
    constructor(details?: string) {
        super(StatusCodes.SERVICE_UNAVAILABLE, details);
    }
}
