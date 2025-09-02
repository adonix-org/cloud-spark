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
import { CorsProvider } from "./cors";
import { CorsDefaults } from "./cors-defaults";
import { CorsHandler } from "./cors-handler";

export abstract class CorsWorker extends BasicWorker {
    protected getCorsProvider(defaults: CorsProvider): CorsProvider {
        return defaults;
    }

    constructor(request: Request, env: Env, ctx: ExecutionContext) {
        super(request, env, ctx);
        this.use(new CorsHandler(this.getCorsProvider(new CorsDefaults())));
    }
}
