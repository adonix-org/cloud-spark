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

import { CacheControl } from "../../constants";
import { HttpHeader } from "../../constants/headers";
import { WorkerResponse } from "../../responses";
import { getHeaderValues } from "../../utils/headers";
import { getCacheControl, getFilteredVary } from "./utils";

export class VariantResponse extends WorkerResponse {
    private _isModified = false;

    private constructor(vary: string[]) {
        if (vary.length === 0) {
            throw new Error("Cannot create a variant response with no vary elements.");
        }
        super();
        this.setHeader(HttpHeader.INTERNAL_VARIANT_SET, getFilteredVary(vary));
    }

    public static new(vary: string[]): VariantResponse {
        return new VariantResponse(getFilteredVary(vary));
    }

    public static restore(source: Response): VariantResponse {
        if (!VariantResponse.isVariantResponse(source)) {
            throw new Error("The source response is not a variant response");
        }

        const variant = VariantResponse.new(
            getHeaderValues(source.headers, HttpHeader.INTERNAL_VARIANT_SET),
        );

        const cacheControl = source.headers.get(HttpHeader.CACHE_CONTROL);
        if (cacheControl) variant.cache = CacheControl.parse(cacheControl);

        return variant;
    }

    public get vary(): string[] {
        return getHeaderValues(this.headers, HttpHeader.INTERNAL_VARIANT_SET);
    }

    public get isModified(): boolean {
        return this._isModified;
    }

    public append(vary: string[]): void {
        const before = this.vary.length;
        this.mergeHeader(HttpHeader.INTERNAL_VARIANT_SET, getFilteredVary(vary));
        this._isModified = this.vary.length !== before;
    }

    public static isVariantResponse(response: Response): boolean {
        return response.headers.has(HttpHeader.INTERNAL_VARIANT_SET);
    }

    /**
     * Ensures this variant response will not expire before the TTL of the given response.
     * Only updates TTL if the response explicitly provides s-maxage or max-age.
     * Does nothing if neither header is present.
     *
     * @param response - The response whose TTL should be considered
     */
    public expireAfter(response: Response): void {
        const incoming = getCacheControl(response.headers);

        const incomingTTL = incoming["s-maxage"] ?? incoming["max-age"];
        if (incomingTTL === undefined) return;

        const currentTTL = this.cache?.["s-maxage"];

        if (currentTTL === undefined || incomingTTL > currentTTL) {
            this.cache = {
                "s-maxage": incomingTTL,
            };
            this._isModified = true;
        }
    }
}
