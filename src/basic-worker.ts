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

import { isMethod, Method } from "./common";
import { CorsProvider } from "./cors";
import { CorsWorker } from "./cors-worker";
import {
    Head,
    InternalServerError,
    MethodNotAllowed,
    NotImplemented,
    Options,
    WorkerResponse,
} from "./response";

export abstract class BasicWorker extends CorsWorker {
    public async fetch(): Promise<Response> {
        if (!this.isAllowed(this.request.method)) {
            return this.getResponse(MethodNotAllowed, this.request.method);
        }

        try {
            return await this.dispatch();
        } catch (error) {
            return this.getResponse(InternalServerError, String(error));
        }
    }

    protected async dispatch(request: Request = this.request): Promise<Response> {
        const method = request.method as Method;
        const handler: Record<Method, () => Promise<Response>> = {
            GET: () => this.get(),
            PUT: () => this.put(),
            POST: () => this.post(),
            PATCH: () => this.patch(),
            DELETE: () => this.delete(),
            HEAD: () => this.head(),
            OPTIONS: () => this.options(),
        };
        return (handler[method] ?? (() => this.getResponse(MethodNotAllowed, method)))();
    }

    protected async get(): Promise<Response> {
        return this.getResponse(NotImplemented);
    }

    protected async put(): Promise<Response> {
        return this.getResponse(NotImplemented);
    }

    protected async post(): Promise<Response> {
        return this.getResponse(NotImplemented);
    }

    protected async patch(): Promise<Response> {
        return this.getResponse(NotImplemented);
    }

    protected async delete(): Promise<Response> {
        return this.getResponse(NotImplemented);
    }

    protected async options(): Promise<Response> {
        return this.getResponse(Options);
    }

    protected async head(): Promise<Response> {
        // Dispatch a new GET request created from the HEAD request
        // and return the GET response with the body removed.
        return this.getResponse(
            Head,
            await this.dispatch(new Request(this.request, { method: Method.GET }))
        );
    }

    protected override getCacheKey(): URL | RequestInfo {
        return super.getCacheKey(this.getOrigin());
    }

    protected async getResponse<
        T extends WorkerResponse,
        Ctor extends new (cors: CorsProvider, ...args: any[]) => T
    >(
        ResponseClass: Ctor,
        ...args: ConstructorParameters<Ctor> extends [CorsProvider, ...infer R] ? R : never
    ): Promise<Response> {
        const response = new ResponseClass(this, ...args).createResponse();
        this.setCachedResponse(response);
        return response;
    }

    public isAllowed(method: string): boolean {
        return isMethod(method) && this.getAllowMethods().includes(method);
    }
}
