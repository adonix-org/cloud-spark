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

import { BasicWorker } from "./basic-worker";
import { NotFound } from "./response";
import { Routes } from "./routes";

export abstract class RoutedWorker extends BasicWorker {
    protected readonly routes: Routes<this> = new Routes(this);

    constructor(request: Request, env: Env = {}, ctx?: ExecutionContext) {
        super(request, env, ctx);
    }

    protected async dispatch(request: Request): Promise<Response> {
        return (await this.search(request)) ?? super.dispatch(request);
    }

    private async search(request: Request): Promise<Response | undefined> {
        const route = this.routes.get(request);
        if (route) {
            if (route.pattern instanceof RegExp) {
                const match = new URL(request.url).pathname.match(
                    route.pattern
                );
                return await route.callback(...(match ?? []));
            } else {
                return await route.callback();
            }
        }
        return undefined;
    }

    protected override get(): Response | Promise<Response> {
        return this.getResponse(NotFound);
    }

    protected override put(): Response | Promise<Response> {
        return this.getResponse(NotFound);
    }

    protected override post(): Response | Promise<Response> {
        return this.getResponse(NotFound);
    }

    protected override patch(): Response | Promise<Response> {
        return this.getResponse(NotFound);
    }

    protected override delete(): Response | Promise<Response> {
        return this.getResponse(NotFound);
    }
}
