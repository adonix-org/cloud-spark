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

import { Worker } from "./worker";

export abstract class BaseWorker implements Worker {
    constructor(
        private readonly _request: Request,
        private readonly _env: Env = {},
        private readonly _ctx?: ExecutionContext
    ) {}

    protected get request(): Request {
        return this._request;
    }

    protected get env(): Env {
        return this._env;
    }

    protected get ctx(): ExecutionContext | undefined {
        return this._ctx;
    }

    public abstract fetch(): Promise<Response>;
}
