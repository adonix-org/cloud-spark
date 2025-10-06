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

import { HttpHeader } from "../../constants/headers";
import { MediaType, UTF8_CHARSET } from "../../constants/media";
import { WorkerResponse } from "../../responses";
import { stringArraysEqual } from "../../utils/compare";
import { withCharset } from "../../utils/media";
import { getCacheControl } from "./utils";

type VariantSet = string[][];

export class VariantResponse extends WorkerResponse {
    private variants: VariantSet = [];

    private constructor() {
        super();
        this.mediaType = withCharset(MediaType.JSON, UTF8_CHARSET);
        this.setHeader(HttpHeader.INTERNAL_VARIANT_SET, "true");
    }

    public static async create(source?: Response): Promise<VariantResponse> {
        const response = new VariantResponse();
        if (!source) return response;

        const header = source.headers.get(HttpHeader.INTERNAL_VARIANT_SET);
        if (!header) {
            throw new Error(
                `Invalid response type. Missing ${HttpHeader.INTERNAL_VARIANT_SET} header.`,
            );
        }

        response.setHeader(HttpHeader.INTERNAL_VARIANT_SET, header);
        response.cache = getCacheControl(source.headers);
        response.variants = await source.json();
        return response;
    }

    public override async response(): Promise<Response> {
        return new Response(JSON.stringify(this.variants), this.responseInit);
    }

    public append(vary: string[]): void {
        this.variants.push(vary);
    }

    public match(vary: string[]): string[] | undefined {
        for (const variant of this.variants) {
            if (stringArraysEqual(variant, vary)) {
                return variant;
            }
        }
        return undefined;
    }

    public static isVariantResponse(response: Response): boolean {
        return response.headers.has(HttpHeader.INTERNAL_VARIANT_SET);
    }
}
