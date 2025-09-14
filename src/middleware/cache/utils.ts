/*
 * Copyright (C) 2025 Ty Busby
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
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

import { HttpHeader } from "../../constants/http";
import { getHeaderValues, lexCompare } from "../../utils";
import { VARY_WILDCARD } from "./constants";

export function isCacheable(response: Response): boolean {
    if (!response.ok) return false;
    if (getVaryHeader(response).includes(VARY_WILDCARD)) return false;

    return true;
}

export function getVaryHeader(response: Response): string[] {
    const values = getHeaderValues(response.headers, HttpHeader.VARY);
    return Array.from(new Set(values.map((v) => v.toLowerCase()))).sort(lexCompare);
}

export function useCached(response: Response): boolean {
    const vary = getVaryHeader(response).filter(
        (value) => value !== HttpHeader.ACCEPT_ENCODING.toLowerCase(),
    );
    return vary.length === 0;
}
