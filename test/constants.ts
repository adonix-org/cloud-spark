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

import { Method } from "../src/common";
import { CorsWorker } from "../src/cors-worker";

export const VALID_ORIGIN = "https://localhost";
export const INVALID_ORIGIN = "https://localhost.invalid";

export const GET_REQUEST = new Request(VALID_ORIGIN, {
    method: Method.GET,
});

export const GET_REQUEST_WITH_ORIGIN = new Request(VALID_ORIGIN, {
    method: Method.GET,
    headers: {
        Origin: VALID_ORIGIN,
    },
});

export class DefaultCorsWorker extends CorsWorker {
    public async fetch(): Promise<Response> {
        return new Response("OK");
    }
}

export class AllowOriginWorker extends DefaultCorsWorker {
    public override getAllowOrigins(): string[] {
        return [VALID_ORIGIN];
    }
}

export class EmptyCorsWorker extends DefaultCorsWorker {
    public override getAllowOrigins(): string[] {
        return [];
    }

    public override getAllowHeaders(): string[] {
        return [];
    }

    public override getAllowMethods(): Method[] {
        return [];
    }

    public override getExposeHeaders(): string[] {
        return [];
    }

    public override getMaxAge(): number {
        return 0;
    }
}
