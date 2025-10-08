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

import { CacheControl } from "../../constants/cache";
import { HttpHeader } from "../../constants/headers";
import { Time } from "../../constants/time";
import { WorkerResponse } from "../../responses";
import { getHeaderValues } from "../../utils/headers";
import { getCacheControl } from "./utils";

const DEFAULT_TTL = 5 * Time.Minute;

const DEFAULT_CACHE: CacheControl = {
    public: true,
    "s-maxage": DEFAULT_TTL,
} as const;

export class VariantResponse extends WorkerResponse {
    public override cache: CacheControl = { ...DEFAULT_CACHE };
    private _isModified = false;

    private constructor(vary: string[]) {
        if (vary.length === 0) {
            throw new Error("Cannot create a variant response with no vary elements.");
        }
        super();
        this.setHeader(HttpHeader.INTERNAL_VARIANT_SET, vary);
    }

    public static new(vary: string[]): VariantResponse {
        return new VariantResponse(vary);
    }

    public static restore(source: Response): VariantResponse {
        if (!VariantResponse.isVariantResponse(source)) {
            throw new Error("The source response is not a Variant Response");
        }

        const response = VariantResponse.new(
            getHeaderValues(source.headers, HttpHeader.INTERNAL_VARIANT_SET),
        );
        response.cache = getCacheControl(source.headers);
        return response;
    }

    public get vary(): string[] {
        return getHeaderValues(this.headers, HttpHeader.INTERNAL_VARIANT_SET);
    }

    public get isModified(): boolean {
        return this._isModified;
    }

    public append(vary: string[]): void {
        const before = this.vary.length;
        this.mergeHeader(HttpHeader.INTERNAL_VARIANT_SET, vary);
        this._isModified = this.vary.length !== before;
    }

    public static isVariantResponse(response: Response): boolean {
        return response.headers.has(HttpHeader.INTERNAL_VARIANT_SET);
    }

    public refreshCache(response: Response): void {
        const incoming = getCacheControl(response.headers);
        const incomingTTL = incoming["s-maxage"] ?? DEFAULT_TTL;
        const currentTTL = this.cache["s-maxage"] ?? DEFAULT_TTL;

        if (incomingTTL > currentTTL) {
            this.cache["s-maxage"] = incomingTTL;
            this._isModified = true;
        }
    }
}
