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

import { CacheWorker } from "./cache-worker";
import { Method, Time } from "./common";
import { CorsProvider } from "./cors";

export abstract class CorsWorker extends CacheWorker implements CorsProvider {
    public getAllowOrigins(): string[] {
        return ["*"];
    }

    public allowAnyOrigin(): boolean {
        return this.getAllowOrigins().includes("*");
    }

    public getAllowMethods(): Method[] {
        return [Method.GET, Method.OPTIONS, Method.HEAD];
    }

    public getAllowHeaders(): string[] {
        return ["Content-Type"];
    }

    public getExposeHeaders(): string[] {
        return [];
    }

    public getMaxAge(): number {
        return Time.Week;
    }

    public getOrigin(): string | null {
        return this.request.headers.get("Origin");
    }
}
