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

import { HttpHeader } from "../constants/http";

/**
 * Extracts and normalizes the `Origin` header from a request.
 *
 * Returns the origin (scheme + host + port) as a string if present and valid.
 * Returns `null` if:
 *   - The `Origin` header is missing
 *   - The `Origin` header is `"null"` (opaque origin)
 *   - The `Origin` header is malformed
 *
 * @param request - The incoming {@link Request} object.
 * @returns The normalized origin string, or `null` if not present or invalid.
 */
export function getOrigin(request: Request): string | null {
    const origin = request.headers.get(HttpHeader.ORIGIN)?.trim();
    if (!origin || origin === "null") return null;

    try {
        return new URL(origin).origin;
    } catch {
        return null;
    }
}
