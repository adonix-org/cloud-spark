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

import { CacheControl } from "./constants/cache";
import { FORBIDDEN_204_HEADERS, FORBIDDEN_304_HEADERS, HttpHeader } from "./constants/headers";
import { MediaType, UTF8_CHARSET } from "./constants/media";
import { GET, HEAD } from "./constants/methods";
import { assertMethods } from "./guards/methods";
import { assertOctetStreamInit } from "./guards/responses";
import { Worker } from "./interfaces";
import { OctetStreamInit } from "./interfaces/response";
import { filterHeaders, mergeHeader, setHeader } from "./utils/headers";
import { withCharset } from "./utils/media";

/**
 * Base class for building HTTP responses.
 * Manages headers, status, and media type.
 */
abstract class BaseResponse {
    /** HTTP headers for the response. */
    public headers: Headers = new Headers();

    /** HTTP status code (default 200 OK). */
    public status: StatusCodes = StatusCodes.OK;

    /** Optional status text. Defaults to standard reason phrase. */
    public statusText?: string;

    /** Optional websocket property. */
    public webSocket?: WebSocket | null;

    /** Default media type of the response body. */
    public mediaType: string = withCharset(MediaType.PLAIN_TEXT, UTF8_CHARSET);

    /** Converts current state to ResponseInit for constructing a Response. */
    protected get responseInit(): ResponseInit {
        return {
            headers: this.headers,
            status: this.status,
            statusText: this.statusText ?? getReasonPhrase(this.status),
            webSocket: this.webSocket,
            encodeBody: "automatic",
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
            this.setHeader(HttpHeader.CONTENT_TYPE, this.mediaType);
        }
    }

    /**
     * Removes headers that are disallowed or discouraged based on the current
     * status code.
     *
     * - **204 No Content:** strips headers that "should not" be sent
     *   (`Content-Length`, `Content-Range`), per the HTTP spec.
     * - **304 Not Modified:** strips headers that "must not" be sent
     *   (`Content-Type`, `Content-Length`, `Content-Range`, etc.), per the HTTP spec.
     *
     * This ensures that responses remain compliant with HTTP/1.1 standards while preserving
     * custom headers that are allowed.
     */
    public filterHeaders(): void {
        if (this.status === StatusCodes.NO_CONTENT) {
            filterHeaders(this.headers, FORBIDDEN_204_HEADERS);
        } else if (this.status === StatusCodes.NOT_MODIFIED) {
            filterHeaders(this.headers, FORBIDDEN_304_HEADERS);
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
            this.setHeader(HttpHeader.CACHE_CONTROL, CacheControl.stringify(this.cache));
        }
    }
}

/**
 * Core response. Combines caching, and content type headers.
 */
export abstract class WorkerResponse extends CacheResponse {
    constructor(
        private readonly body: BodyInit | null = null,
        cache?: CacheControl,
    ) {
        super(cache);
    }

    /** Builds the Response with body, headers, and status. */
    public async response(): Promise<Response> {
        this.addCacheHeader();

        const body = [StatusCodes.NO_CONTENT, StatusCodes.NOT_MODIFIED].includes(this.status)
            ? null
            : this.body;

        if (body) this.addContentType();

        this.filterHeaders();

        return new Response(body, this.responseInit);
    }
}

/**
 * Copies an existing response for mutation. Pass in a CacheControl
 * to be used for the response, overriding any existing `cache-control`
 * on the source response.
 */
export class CopyResponse extends WorkerResponse {
    constructor(response: Response, cache?: CacheControl) {
        super(response.body, cache);
        this.status = response.status;
        this.statusText = response.statusText;
        this.headers = new Headers(response.headers);
    }
}

/**
 * Copies the response, but with null body and status 304 Not Modified.
 */
export class NotModified extends WorkerResponse {
    constructor(response: Response) {
        super();
        this.status = StatusCodes.NOT_MODIFIED;
        this.headers = new Headers(response.headers);
    }
}

/**
 * Represents a successful response with customizable body, cache and status.
 */
export class SuccessResponse extends WorkerResponse {
    constructor(
        body: BodyInit | null = null,
        cache?: CacheControl,
        status: StatusCodes = StatusCodes.OK,
    ) {
        super(body, cache);
        this.status = status;
    }
}

/**
 * JSON response. Automatically sets Content-Type to application/json.
 */
export class JsonResponse extends SuccessResponse {
    constructor(json: unknown = {}, cache?: CacheControl, status: StatusCodes = StatusCodes.OK) {
        super(JSON.stringify(json), cache, status);
        this.mediaType = withCharset(MediaType.JSON, UTF8_CHARSET);
    }
}

/**
 * HTML response. Automatically sets Content-Type to text/html.
 */
export class HtmlResponse extends SuccessResponse {
    constructor(
        body: string,
        cache?: CacheControl,
        status: StatusCodes = StatusCodes.OK,
        charset: string = UTF8_CHARSET,
    ) {
        super(body, cache, status);
        this.mediaType = withCharset(MediaType.HTML, charset);
    }
}

/**
 * Plain text response. Automatically sets Content-Type to text/plain.
 */
export class TextResponse extends SuccessResponse {
    constructor(
        body: string,
        cache?: CacheControl,
        status: StatusCodes = StatusCodes.OK,
        charset: string = UTF8_CHARSET,
    ) {
        super(body, cache, status);
        this.mediaType = withCharset(MediaType.PLAIN_TEXT, charset);
    }
}

/**
 * Represents an HTTP response for serving binary data as `application/octet-stream`.
 *
 * This class wraps a `ReadableStream` and sets all necessary headers for both
 * full and partial content responses, handling range requests in a hybrid way
 * to maximize browser and CDN caching.
 *
 * Key behaviors:
 * - `Content-Type` is set to `application/octet-stream`.
 * - `Accept-Ranges: bytes` is always included.
 * - `Content-Length` is always set to the validated length of the response body.
 * - If the request is a true partial range (offset > 0 or length < size), the response
 *   will be `206 Partial Content` with the appropriate `Content-Range` header.
 * - If the requested range covers the entire file (even if a Range header is present),
 *   the response will return `200 OK` to enable browser and edge caching.
 * - Zero-length streams (`size = 0`) are never treated as partial.
 * - Special case: a requested range of `0-0` on a non-empty file is normalized to 1 byte.
 */
export class OctetStream extends WorkerResponse {
    constructor(stream: ReadableStream, init: OctetStreamInit, cache?: CacheControl) {
        assertOctetStreamInit(init);

        super(stream, cache);
        this.mediaType = MediaType.OCTET_STREAM;

        const normalized = OctetStream.normalizeInit(init);
        const { size, offset, length } = normalized;

        if (OctetStream.isPartial(normalized)) {
            this.setHeader(
                HttpHeader.CONTENT_RANGE,
                `bytes ${offset}-${offset + length - 1}/${size}`,
            );
            this.status = StatusCodes.PARTIAL_CONTENT;
        }

        this.setHeader(HttpHeader.ACCEPT_RANGES, "bytes");
        this.setHeader(HttpHeader.CONTENT_LENGTH, `${length}`);
    }

    /**
     * Normalizes a partially-specified `OctetStreamInit` into a fully-specified object.
     *
     * Ensures that all required fields (`size`, `offset`, `length`) are defined:
     * - `offset` defaults to 0 if not provided.
     * - `length` defaults to `size - offset` if not provided.
     * - Special case: if `offset` and `length` are both 0 but `size > 0`, `length` is set to 1
     *   to avoid zero-length partial streams.
     *
     * @param init - The initial `OctetStreamInit` object, possibly with missing `offset` or `length`.
     * @returns A fully-specified `OctetStreamInit` object with `size`, `offset`, and `length` guaranteed.
     */
    private static normalizeInit(init: OctetStreamInit): Required<OctetStreamInit> {
        const { size } = init;
        const offset = init.offset ?? 0;
        let length = init.length ?? size - offset;

        if (offset === 0 && length === 0 && size > 0) {
            length = 1;
        }

        return { size, offset, length };
    }

    /**
     * Determines whether the given `OctetStreamInit` represents a partial range.
     *
     * Partial ranges are defined as any range that does **not** cover the entire file:
     * - If `size === 0`, the stream is never partial.
     * - If `offset === 0` and `length === size`, the stream is treated as a full file (not partial),
     *   even if a Range header is present. This enables browser and CDN caching.
     * - All other cases are considered partial, and will result in a `206 Partial Content` response.
     *
     * @param init - A fully-normalized `OctetStreamInit` object.
     * @returns `true` if the stream represents a partial range; `false` if it represents the full file.
     */
    private static isPartial(init: Required<OctetStreamInit>): boolean {
        if (init.size === 0) return false;
        return !(init.offset === 0 && init.length === init.size);
    }
}

/**
 * A streaming response for Cloudflare R2 objects.
 *
 * **Partial content support:** To enable HTTP 206 streaming, you must provide
 * request headers containing the `Range` header when calling the R2 bucket's `get()` method.
 *
 * Example:
 * ```ts
 * const stream = await this.env.R2_BUCKET.get("key", { range: this.request.headers });
 * ```
 *
 * @param source - The R2 object to stream.
 * @param cache - Optional caching override.
 */
export class R2ObjectStream extends OctetStream {
    constructor(source: R2ObjectBody, cache?: CacheControl) {
        let useCache = cache;
        if (!useCache && source.httpMetadata?.cacheControl) {
            useCache = CacheControl.parse(source.httpMetadata.cacheControl);
        }

        super(source.body, R2ObjectStream.computeRange(source.size, source.range), useCache);

        this.setHeader(HttpHeader.ETAG, source.httpEtag);

        if (source.httpMetadata?.contentType) {
            this.mediaType = source.httpMetadata.contentType;
        }
    }

    /**
     * Computes an `OctetStreamInit` object from a given R2 range.
     *
     * This function normalizes a Cloudflare R2 `R2Range` into the shape expected
     * by `OctetStream`. It handles the following cases:
     *
     * - No range provided → returns `{ size }` (full content).
     * - `suffix` range → calculates the offset and length from the end of the file.
     * - Explicit `offset` and/or `length` → passed through as-is.
     *
     * @param size - The total size of the file/object.
     * @param range - Optional range to extract (from R2). Can be:
     *   - `{ offset: number; length?: number }`
     *   - `{ offset?: number; length: number }`
     *   - `{ suffix: number }`
     * @returns An `OctetStreamInit` object suitable for `OctetStream`.
     */
    private static computeRange(size: number, range?: R2Range): OctetStreamInit {
        if (!range) return { size };

        if ("suffix" in range) {
            const offset = Math.max(0, size - range.suffix);
            const length = size - offset;
            return { size, offset, length };
        }

        return { size, ...range };
    }
}

/**
 * Response for WebSocket upgrade requests.
 * Automatically sets status to 101 and attaches the client socket.
 */
export class WebSocketUpgrade extends WorkerResponse {
    constructor(client: WebSocket) {
        super();
        this.status = StatusCodes.SWITCHING_PROTOCOLS;
        this.webSocket = client;
    }
}

/**
 * Response for `HEAD` requests. Copy headers and status from a `GET` response
 * without the body.
 */
export class Head extends WorkerResponse {
    constructor(get: Response) {
        super();
        this.status = get.status;
        this.statusText = get.statusText;
        this.headers = new Headers(get.headers);
    }
}

/**
 * Response for `OPTIONS` requests.
 */
export class Options extends WorkerResponse {
    constructor(worker: Worker) {
        const allowed = Array.from(new Set([...worker.getAllowedMethods(), GET, HEAD]));
        assertMethods(allowed);

        super();
        this.status = StatusCodes.NO_CONTENT;
        this.setHeader(HttpHeader.ALLOW, allowed);
    }
}
