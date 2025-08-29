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
import { CorsWorker, JsonResponse } from "./response";

export interface ErrorJson {
    status: number;
    error: string;
    details: string;
}

export class HttpError extends JsonResponse {
    constructor(worker: CorsWorker, status: StatusCodes, protected readonly details?: string) {
        const json: ErrorJson = {
            status,
            error: getReasonPhrase(status),
            details: details ?? getReasonPhrase(status),
        };
        super(worker, json, CacheControl.DISABLE, status);
    }
}

export class BadRequest extends HttpError {
    constructor(worker: CorsWorker, details?: string) {
        super(worker, StatusCodes.BAD_REQUEST, details);
    }
}

export class Unauthorized extends HttpError {
    constructor(worker: CorsWorker, details?: string) {
        super(worker, StatusCodes.UNAUTHORIZED, details);
    }
}

export class Forbidden extends HttpError {
    constructor(worker: CorsWorker, details?: string) {
        super(worker, StatusCodes.FORBIDDEN, details);
    }
}

export class NotFound extends HttpError {
    constructor(worker: CorsWorker, details?: string) {
        super(worker, StatusCodes.NOT_FOUND, details);
    }
}

export class MethodNotAllowed extends HttpError {
    constructor(worker: CorsWorker) {
        super(
            worker,
            StatusCodes.METHOD_NOT_ALLOWED,
            `${worker.request.method} method not allowed.`
        );
        this.setHeader(HttpHeader.ALLOW, this.worker.getAllowMethods());
    }
}

export class InternalServerError extends HttpError {
    constructor(worker: CorsWorker, details?: string) {
        super(worker, StatusCodes.INTERNAL_SERVER_ERROR, details);
    }
}

export class NotImplemented extends HttpError {
    constructor(worker: CorsWorker, details?: string) {
        super(worker, StatusCodes.NOT_IMPLEMENTED, details);
    }
}

export class MethodNotImplemented extends NotImplemented {
    constructor(worker: CorsWorker) {
        super(worker, `${worker.request.method} method not implemented.`);
    }
}

export class ServiceUnavailable extends HttpError {
    constructor(worker: CorsWorker, details?: string) {
        super(worker, StatusCodes.SERVICE_UNAVAILABLE, details);
    }
}
