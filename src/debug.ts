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

import { Method } from "./common";
import { JsonResponse, TextResponse } from "./response";
import { RoutedWorker } from "./routed-worker";

class DebugWorker extends RoutedWorker {
    protected addRoutes(): void {
        this.routes.append({
            pattern: new RegExp(`^/api/v1/seasons/(\\d{4})$`),
            callback: this.getSeasons,
        });
        this.routes.append({
            pattern: `/api/v1/seasons`,
            callback: (): Response => {
                return this.getResponse(TextResponse, "Just a test.");
            },
        });
    }

    protected getSeasons(...matches: string[]): Response {
        return this.getResponse(JsonResponse, { season: matches[1] });
    }

    public override getAllowOrigins(): string[] {
        return ["https://www.adonix.org", "https://www.tybusby.com"];
    }

    protected override get(): Response {
        return this.getResponse(TextResponse, "Hello 🌎");
    }
}

const method: Method = Method.GET;

const request = new Request("https://www.adonix.org/api/v1/seasons", {
    method: method,
    headers: {
        Origin: "https://www.adonix.org",
    },
});
const worker = new DebugWorker(request);
const response = await worker.fetch();

const text = await response.text();
console.log(response);
console.log("body:", text || "EMPTY");
