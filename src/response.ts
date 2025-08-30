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
import {
    CacheControl,
    getContentType,
    HttpHeader,
    mergeHeader,
    MediaType,
    setHeader,
    getOrigin,
} from "./common";
import { addCorsHeaders, CorsProvider } from "./cors";
import { Worker } from "./worker";

export type CorsWorker = Worker & CorsProvider;

abstract class BaseResponse {
    public headers: Headers = new Headers();
    public status: StatusCodes = StatusCodes.OK;
    public statusText?: string;
    public mediaType?: MediaType;

    protected get responseInit(): ResponseInit {
        return {
            headers: this.headers,
            status: this.status,
            statusText: this.statusText ?? getReasonPhrase(this.status),
        };
    }

    public setHeader(key: string, value: string | string[]): void {
        setHeader(this.headers, key, value);
    }

    public mergeHeader(key: string, value: string | string[]): void {
        mergeHeader(this.headers, key, value);
    }

    public addContentType() {
        if (this.mediaType) {
            this.headers.set(HttpHeader.CONTENT_TYPE, getContentType(this.mediaType));
        }
    }
}

abstract class CorsResponse extends BaseResponse {
    constructor(public readonly worker: CorsWorker) {
        super();
    }

    protected addCorsHeaders(): void {
        addCorsHeaders(this.getOrigin(), this.worker, this.headers);

        if (!this.worker.allowAnyOrigin()) {
            this.mergeHeader(HttpHeader.VARY, HttpHeader.ORIGIN);
        }
    }

    protected getOrigin() {
        return getOrigin(this.worker.request);
    }
}

abstract class CacheResponse extends CorsResponse {
    constructor(worker: CorsWorker, public cache?: CacheControl) {
        super(worker);
    }

    protected addCacheHeader(): void {
        if (this.cache) {
            this.headers.set(HttpHeader.CACHE_CONTROL, CacheControl.stringify(this.cache));
        }
    }
}

export abstract class WorkerResponse extends CacheResponse {
    constructor(
        worker: CorsWorker,
        private readonly body: BodyInit | null = null,
        cache?: CacheControl
    ) {
        super(worker, cache);
    }

    public getResponse(): Response {
        this.addCorsHeaders();
        this.addCacheHeader();
        this.addSecurityHeaders();

        const body = this.status === StatusCodes.NO_CONTENT ? null : this.body;

        if (body) this.addContentType();
        return new Response(body, this.responseInit);
    }

    protected addSecurityHeaders(): void {
        this.setHeader(HttpHeader.X_CONTENT_TYPE_OPTIONS, HttpHeader.NOSNIFF);
    }
}

export class ClonedResponse extends WorkerResponse {
    constructor(worker: CorsWorker, response: Response, cache?: CacheControl) {
        const clone = response.clone();
        super(worker, clone.body, cache);
        this.headers = new Headers(clone.headers);
        this.status = clone.status;
        this.statusText = clone.statusText;
    }
}

export class SuccessResponse extends WorkerResponse {
    constructor(
        worker: CorsWorker,
        body: BodyInit | null = null,
        cache?: CacheControl,
        status: StatusCodes = StatusCodes.OK
    ) {
        super(worker, body, cache);
        this.status = status;
    }
}

export class JsonResponse extends SuccessResponse {
    constructor(
        worker: CorsWorker,
        json: unknown = {},
        cache?: CacheControl,
        status: StatusCodes = StatusCodes.OK
    ) {
        super(worker, JSON.stringify(json), cache, status);
        this.mediaType = MediaType.JSON;
    }
}

export class HtmlResponse extends SuccessResponse {
    constructor(
        worker: CorsWorker,
        body: string,
        cache?: CacheControl,
        status: StatusCodes = StatusCodes.OK
    ) {
        super(worker, body, cache, status);
        this.mediaType = MediaType.HTML;
    }
}

export class TextResponse extends SuccessResponse {
    constructor(
        worker: CorsWorker,
        content: string,
        cache?: CacheControl,
        status: StatusCodes = StatusCodes.OK
    ) {
        super(worker, content, cache, status);
        this.mediaType = MediaType.PLAIN_TEXT;
    }
}

/**
 * Removes the body from a GET response.
 */
export class Head extends WorkerResponse {
    constructor(worker: CorsWorker, get: Response) {
        super(worker);
        this.headers = new Headers(get.headers);
    }
}

export class Options extends SuccessResponse {
    constructor(worker: CorsWorker) {
        super(worker, null, undefined, StatusCodes.NO_CONTENT);
        this.setHeader(HttpHeader.ALLOW, this.worker.getAllowMethods());
    }
}
