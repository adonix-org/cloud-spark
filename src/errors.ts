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

import { getReasonPhrase } from "http-status-codes";
import { CacheControl, HttpHeader, StatusCodes } from "./common";
import { JsonResponse } from "./responses";
import { Worker } from "./interfaces/worker";
import { ErrorJson } from "./interfaces/error-json";

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
        worker: Worker,
        status: StatusCodes,
        protected readonly details?: string,
    ) {
        const json: ErrorJson = {
            status,
            error: getReasonPhrase(status),
            details: details ?? "",
        };
        super(worker, json, CacheControl.DISABLE, status);
    }
}

/** 400 Bad Request error response. */
export class BadRequest extends HttpError {
    constructor(worker: Worker, details?: string) {
        super(worker, StatusCodes.BAD_REQUEST, details);
    }
}

/** 401 Unauthorized error response. */
export class Unauthorized extends HttpError {
    constructor(worker: Worker, details?: string) {
        super(worker, StatusCodes.UNAUTHORIZED, details);
    }
}

/** 403 Forbidden error response. */
export class Forbidden extends HttpError {
    constructor(worker: Worker, details?: string) {
        super(worker, StatusCodes.FORBIDDEN, details);
    }
}

/** 404 Not Found error response. */
export class NotFound extends HttpError {
    constructor(worker: Worker, details?: string) {
        super(worker, StatusCodes.NOT_FOUND, details);
    }
}

/** 405 Method Not Allowed error response. */
export class MethodNotAllowed extends HttpError {
    constructor(worker: Worker) {
        super(
            worker,
            StatusCodes.METHOD_NOT_ALLOWED,
            `${worker.request.method} method not allowed.`,
        );
        this.setHeader(HttpHeader.ALLOW, this.worker.getAllowedMethods());
    }
}

/** 500 Internal Server Error response. */
export class InternalServerError extends HttpError {
    constructor(worker: Worker, details?: string) {
        super(worker, StatusCodes.INTERNAL_SERVER_ERROR, details);
    }
}

/** 501 Not Implemented error response. */
export class NotImplemented extends HttpError {
    constructor(worker: Worker, details?: string) {
        super(worker, StatusCodes.NOT_IMPLEMENTED, details);
    }
}

/** 501 Method Not Implemented error response for unsupported HTTP methods. */
export class MethodNotImplemented extends NotImplemented {
    constructor(worker: Worker) {
        super(worker, `${worker.request.method} method not implemented.`);
    }
}

/** 503 Service Unavailable error response. */
export class ServiceUnavailable extends HttpError {
    constructor(worker: Worker, details?: string) {
        super(worker, StatusCodes.SERVICE_UNAVAILABLE, details);
    }
}
