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
import { isMethod, Method } from "./common";
import { MethodNotAllowed, InternalServerError, MethodNotImplemented } from "./errors";
import { CorsWorker, Head, Options, WorkerResponse } from "./response";

export abstract class BasicWorker extends CacheWorker {
    public async fetch(): Promise<Response> {
        if (!this.isAllowed(this.request.method)) {
            return this.getResponse(MethodNotAllowed);
        }

        try {
            return await this.dispatch();
        } catch (error) {
            return this.getResponse(InternalServerError, String(error));
        }
    }

    protected async dispatch(): Promise<Response> {
        const method = this.request.method as Method;
        const handler: Record<Method, () => Promise<Response>> = {
            GET: () => this.get(),
            PUT: () => this.put(),
            HEAD: () => this.head(),
            POST: () => this.post(),
            PATCH: () => this.patch(),
            DELETE: () => this.delete(),
            OPTIONS: () => this.options(),
        };
        return (handler[method] ?? (() => this.getResponse(MethodNotAllowed)))();
    }

    public isAllowed(method: string): boolean {
        return isMethod(method) && this.getAllowMethods().includes(method);
    }

    protected async get(): Promise<Response> {
        return this.getResponse(MethodNotImplemented);
    }

    protected async put(): Promise<Response> {
        return this.getResponse(MethodNotImplemented);
    }

    protected async post(): Promise<Response> {
        return this.getResponse(MethodNotImplemented);
    }

    protected async patch(): Promise<Response> {
        return this.getResponse(MethodNotImplemented);
    }

    protected async delete(): Promise<Response> {
        return this.getResponse(MethodNotImplemented);
    }

    protected async options(): Promise<Response> {
        return this.getResponse(Options);
    }

    protected async head(): Promise<Response> {
        const worker = this.create(new Request(this.request, { method: Method.GET }));
        return this.getResponse(Head, await worker.fetch());
    }

    protected async getResponse<
        T extends WorkerResponse,
        Ctor extends new (worker: CorsWorker, ...args: any[]) => T
    >(
        ResponseClass: Ctor,
        ...args: ConstructorParameters<Ctor> extends [CorsWorker, ...infer R] ? R : never
    ): Promise<Response> {
        const response = new ResponseClass(this, ...args).getResponse();
        this.setCachedResponse(response);
        return response;
    }
}
