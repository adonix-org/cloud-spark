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

import { HttpHeader } from "../../../constants/headers";
import { PreconditionFailed } from "../../../errors";
import { NotModified } from "../../../responses";

import { CacheValidators } from "./interfaces";
import { toDate } from "./utils";
import { ValidationRule } from "./validation";

/**
 * Base class for `Last-Modified` header cache validation rules.
 *
 * `LastModifiedRule` specializes `ValidationRule` to handle the
 * `Last-Modified` header. It converts the header value into a
 * timestamp and delegates validation logic to subclasses.
 *
 * Subclasses implement behavior for conditional requests such as
 * `If-Modified-Since` and `If-Unmodified-Since`.
 */
abstract class LastModifiedRule extends ValidationRule<number> {
    /**
     * Extracts and parses the `Last-Modified` header from a response.
     *
     * @param response - The response to inspect.
     * @returns The timestamp in milliseconds since epoch, or `undefined` if unavailable.
     */
    protected override getHeader(response: Response): number | undefined {
        return toDate(response.headers.get(HttpHeader.LAST_MODIFIED));
    }
}

/**
 * Implements the `If-Modified-Since` conditional request validation.
 *
 * If the resource has not been modified since the specified timestamp,
 * the rule returns a `304 Not Modified` response.
 *
 * Otherwise, `undefined` is returned to indicate the cache entry
 * cannot be used.
 */
export class ModifiedSinceRule extends LastModifiedRule {
    /**
     * Applies `If-Modified-Since` validation against the response’s `Last-Modified` value.
     *
     * @param response - The original response from cache.
     * @param lastModified - Timestamp of the resource’s last modification.
     * @param validators - Parsed cache validators from the request.
     * @returns A `304 Not Modified` response if the resource is unmodified,
     *          the original response if no validator is present,
     *          or `undefined` if the cache should not be used.
     */
    protected async response(
        response: Response,
        lastModified: number,
        validators: CacheValidators,
    ): Promise<Response | undefined> {
        const modifiedSince = toDate(validators.ifModifiedSince);
        if (modifiedSince === undefined) return response;

        if (lastModified <= modifiedSince) return new NotModified(response).response();

        return undefined;
    }
}

/**
 * Implements the `If-Unmodified-Since` conditional request validation.
 *
 * If the resource has been modified after the specified timestamp,
 * the rule returns a `412 Precondition Failed` response.
 *
 * Otherwise, the original response is returned.
 */
export class UnmodifiedSinceRule extends LastModifiedRule {
    /**
     * Applies `If-Unmodified-Since` validation against the response’s `Last-Modified` value.
     *
     * @param response - The original response from cache.
     * @param lastModified - Timestamp of the resource’s last modification.
     * @param validators - Parsed cache validators from the request.
     * @returns A `412 Precondition Failed` response if the resource was modified
     *          after the specified timestamp, or the original response if valid.
     */
    protected async response(
        response: Response,
        lastModified: number,
        validators: CacheValidators,
    ): Promise<Response | undefined> {
        const unmodifiedSince = toDate(validators.ifUnmodifiedSince);
        if (unmodifiedSince === undefined) return response;

        if (lastModified > unmodifiedSince) {
            return new PreconditionFailed(
                `Last-Modified: ${new Date(lastModified).toUTCString()}`,
            ).response();
        }

        return response;
    }
}
