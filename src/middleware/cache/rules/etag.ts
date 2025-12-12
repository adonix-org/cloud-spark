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
import { isNotModified, isPreconditionFailed } from "./utils";
import { ValidationRule } from "./validation";

/**
 * Base class for ETag-based cache validation rules.
 *
 * `MatchRule` specializes `ValidationRule` to handle `ETag` headers.
 * It extracts the `ETag` from the response and delegates validation
 * to subclasses via the `response()` method.
 *
 * Subclasses implement the behavior for specific conditional requests,
 * such as `If-Match` or `If-None-Match`.
 */
abstract class MatchRule extends ValidationRule<string> {
    /**
     * Extracts the `ETag` header from a response.
     *
     * @param response - The response to inspect.
     * @returns The ETag string if present; otherwise `undefined`.
     */
    protected override getHeader(response: Response): string | undefined {
        return response.headers.get(HttpHeader.ETAG) ?? undefined;
    }
}

/**
 * Implements the `If-Match` conditional request validation.
 *
 * If the `If-Match` header is present and the response’s ETag does
 * not match any of the listed values, the rule returns a
 * `412 Precondition Failed` response.
 *
 * Otherwise, the original response is returned unchanged.
 */
export class IfMatchRule extends MatchRule {
    /**
     * Applies `If-Match` validation against the response’s ETag.
     *
     * @param response - The original response from cache.
     * @param etag - The ETag extracted from the response.
     * @param validators - Parsed cache validators from the request.
     * @returns A `Response` with `412 Precondition Failed` if validation fails,
     *          or the original response if the precondition passes.
     */
    protected async response(
        response: Response,
        etag: string,
        validators: CacheValidators,
    ): Promise<Response | undefined> {
        if (isPreconditionFailed(validators.ifMatch, etag)) {
            return new PreconditionFailed(`ETag: ${etag}`).response();
        }

        return response;
    }
}

/**
 * Implements the `If-None-Match` conditional request validation.
 *
 * If the `If-None-Match` header is present and the response’s ETag matches
 * one of the listed values, the rule returns a `304 Not Modified` response.
 *
 * If `If-None-Match` is present but does not match, the cache entry
 * is considered invalid and `undefined` is returned.
 */
export class IfNoneMatchRule extends MatchRule {
    /**
     * Applies `If-None-Match` validation against the response’s ETag.
     *
     * @param response - The original response from cache.
     * @param etag - The ETag extracted from the response.
     * @param validators - Parsed cache validators from the request.
     * @returns A `304 Not Modified` response if the resource is unmodified,
     *          the original response if no validators are present,
     *          or `undefined` if validation fails and the cache should not be used.
     */
    protected async response(
        response: Response,
        etag: string,
        validators: CacheValidators,
    ): Promise<Response | undefined> {
        if (validators.ifNoneMatch.length === 0) return response;

        if (isNotModified(validators.ifNoneMatch, etag)) {
            return new NotModified(response).response();
        }

        return undefined;
    }
}
