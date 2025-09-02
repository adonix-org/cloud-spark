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

import { Time } from "./common";
import { CorsProvider } from "./cors";

/**
 * Abstract base class for Workers to provide a default CORS policy.
 *
 * Implements the `CorsProvider` interface and provides a standard policy:
 * - Allows all origins (`*`) by default.
 * - Allows the `Content-Type` header.
 * - Exposes no additional headers.
 * - Sets CORS preflight max-age to one week.
 *
 * Subclasses can override any of the methods to customize the CORS behavior.
 */
export class CorsDefaults implements CorsProvider {
    /** Returns the allowed origins. Default: all origins (`*`). */
    public getAllowedOrigins(): string[] {
        return ["*"];
    }

    /** Returns true if any origin is allowed (i.e., `*` is present). */
    public allowAnyOrigin(): boolean {
        return this.getAllowedOrigins().includes("*");
    }

    /** Returns the allowed headers for CORS requests. Default: `Content-Type`. */
    public getAllowedHeaders(): string[] {
        return ["Content-Type"];
    }

    /** Returns the headers exposed to the client. Default: none. */
    public getExposedHeaders(): string[] {
        return [];
    }

    /** Returns the max age (in seconds) for preflight requests. Default: 1 week. */
    public getMaxAge(): number {
        return Time.Week;
    }
}
