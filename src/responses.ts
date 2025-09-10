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
} from "./common";
import { Worker } from "./interfaces/worker";

/**
 * Base class for building HTTP responses.
 * Manages headers, status, and media type.
 */
abstract class BaseResponse {
    constructor() {}

    /** HTTP headers for the response. */
    public headers: Headers = new Headers();

    /** HTTP status code (default 200 OK). */
    public status: StatusCodes = StatusCodes.OK;

    /** Optional status text. Defaults to standard reason phrase. */
    public statusText?: string;

    /** Default media type of the response body. */
    public mediaType: MediaType = MediaType.PLAIN_TEXT;

    /** Converts current state to ResponseInit for constructing a Response. */
    protected get responseInit(): ResponseInit {
        return {
            headers: this.headers,
            status: this.status,
            statusText: this.statusText ?? getReasonPhrase(this.status),
        };
    }

    /** Sets a header, overwriting any existing value. */
    public setHeader(key: string, value: string | string[]): void {
        setHeader(this.headers, key, value);
    }

    /** Merges a header with existing values (does not overwrite). */
    public mergeHeader(key: string, value: string | string[]): void {
        mergeHeader(this.headers, key, value);
    }

    /** Adds a Content-Type header if not already existing (does not overwrite). */
    public addContentType() {
        if (!this.headers.get(HttpHeader.CONTENT_TYPE)) {
            this.headers.set(HttpHeader.CONTENT_TYPE, getContentType(this.mediaType));
        }
    }
}

/**
 * Base response class that adds caching headers.
 */
abstract class CacheResponse extends BaseResponse {
    constructor(public cache?: CacheControl) {
        super();
    }

    /** Adds Cache-Control header if caching is configured. */
    protected addCacheHeader(): void {
        if (this.cache) {
            this.headers.set(HttpHeader.CACHE_CONTROL, CacheControl.stringify(this.cache));
        }
    }
}

/**
 * Core worker response. Combines caching, and security headers.
 */
export abstract class WorkerResponse extends CacheResponse {
    constructor(
        public readonly worker: Worker,
        private readonly body: BodyInit | null = null,
        cache?: CacheControl,
    ) {
        super(cache);
    }

    /** Builds the Response object with body, headers, and status. */
    public async getResponse(): Promise<Response> {
        this.addCacheHeader();

        const body = this.status === StatusCodes.NO_CONTENT ? null : this.body;

        if (body) this.addContentType();
        return new Response(body, this.responseInit);
    }
}

/**
 * Wraps an existing Response and clones its body, headers, and status.
 */
export class ClonedResponse extends WorkerResponse {
    constructor(worker: Worker, response: Response, cache?: CacheControl) {
        const clone = response.clone();
        super(worker, clone.body, cache);
        this.headers = new Headers(clone.headers);
        this.status = clone.status;
        this.statusText = clone.statusText;
    }
}

/**
 * Represents a successful response with customizable body and status.
 */
export class SuccessResponse extends WorkerResponse {
    constructor(
        worker: Worker,
        body: BodyInit | null = null,
        cache?: CacheControl,
        status: StatusCodes = StatusCodes.OK,
    ) {
        super(worker, body, cache);
        this.status = status;
    }
}

/**
 * JSON response. Automatically sets Content-Type to application/json.
 */
export class JsonResponse extends SuccessResponse {
    constructor(
        worker: Worker,
        json: unknown = {},
        cache?: CacheControl,
        status: StatusCodes = StatusCodes.OK,
    ) {
        super(worker, JSON.stringify(json), cache, status);
        this.mediaType = MediaType.JSON;
    }
}

/**
 * HTML response. Automatically sets Content-Type to text/html.
 */
export class HtmlResponse extends SuccessResponse {
    constructor(
        worker: Worker,
        body: string,
        cache?: CacheControl,
        status: StatusCodes = StatusCodes.OK,
    ) {
        super(worker, body, cache, status);
        this.mediaType = MediaType.HTML;
    }
}

/**
 * Plain text response. Automatically sets Content-Type to text/plain.
 */
export class TextResponse extends SuccessResponse {
    constructor(
        worker: Worker,
        content: string,
        cache?: CacheControl,
        status: StatusCodes = StatusCodes.OK,
    ) {
        super(worker, content, cache, status);
        this.mediaType = MediaType.PLAIN_TEXT;
    }
}

/**
 * Response for HEAD requests. Clones headers but has no body.
 */
export class Head extends WorkerResponse {
    constructor(worker: Worker, get: Response) {
        super(worker);
        this.headers = new Headers(get.headers);
    }
}
