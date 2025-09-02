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
import { CorsHandler } from "./cors-handler";

/**
 * Abstract worker that automatically applies CORS headers via middleware.
 *
 * This class registers a `CorsHandler` middleware automatically in the constructor.
 */
export abstract class CorsWorker extends BasicWorker {
    /**
     * Creates a new CorsWorker instance and registers the `CorsHandler` middleware.
     *
     * @param request - The incoming request
     * @param env - The Cloudflare Workers environment variables
     * @param ctx - The Cloudflare execution context
     */
    constructor(request: Request, env: Env, ctx: ExecutionContext) {
        super(request, env, ctx);
        this.use(new CorsHandler(this.getCorsProvider(new CorsProvider())));
    }

    /**
     * Returns the CORS policy to use for this worker.
     *
     * Subclasses can override this method to tweak the defaults, e.g.,
     * add allowed headers or change allowed origins.
     *
     * @param defaults - The default `CorsProvider` instance
     * @returns A `CorsProvider` instance representing the policy
     */
    protected getCorsProvider(defaults: CorsProvider): CorsProvider {
        return defaults;
    }
}
