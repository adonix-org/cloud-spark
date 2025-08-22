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
import { ClonedResponse, JsonResponse, TextResponse } from "./response";
import { RoutedWorker } from "./routed-worker";

class DebugWorker extends RoutedWorker {
    private static PLAYLIST = "^/api/v1/seasons/(\\d{4})$";
    private static SEASONS = "^/api/v1/seasons$";
    private static LAST = "^/api/v1/seasons$";

    constructor(request: Request, env: Env = {}, ctx?: ExecutionContext) {
        super(request, env, ctx);

        this.add(Method.GET, DebugWorker.PLAYLIST, this.getPlaylist)
            .add(Method.GET, DebugWorker.SEASONS, this.getSeasons)
            .add(
                Method.GET,
                DebugWorker.LAST,
                (): Response => this.getResponse(JsonResponse, [2026])
            );
    }

    protected getPlaylist(...matches: string[]): Response {
        return this.getResponse(JsonResponse, { season: matches[1] });
    }

    protected getSeasons(): Response {
        return this.getResponse(JsonResponse, [2001, 20002, 2003, 2004]);
    }

    public override getAllowOrigins(): string[] {
        return ["https://www.adonix.org", "https://www.tybusby.com"];
    }

    protected override async get(): Promise<Response> {
        //return this.getResponse(InternalServerError, "Goodbye World!");
        return this.getResponse(TextResponse, "Hello 🌎", { public: true, "max-age": 0 });
    }
}

const method: Method = Method.HEAD;

const request = new Request("https://www.adonix.org/api/v1/seasons/20213", {
    method: method,
    headers: {
        Origin: "https://www.adonix.org",
    },
});
const worker = new DebugWorker(request);

const response = await worker.fetch();
console.log(response);

const clone = new ClonedResponse(worker, response, { private: true, "max-age": 9000 });
console.log(clone.createResponse());

console.log(await response.text());
