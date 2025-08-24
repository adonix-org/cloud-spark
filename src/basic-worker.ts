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

import { isMethod, Method, Time } from "./common";
import {
    CorsProvider,
    Head,
    InternalServerError,
    MethodNotAllowed,
    NotImplemented,
    Options,
    WorkerResponse,
} from "./response";

export abstract class BasicWorker implements CorsProvider {
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

    public async fetch(): Promise<Response> {
        if (!this.isAllowed(this.request.method)) {
            return this.getResponse(MethodNotAllowed, this.request.method);
        }

        try {
            return await this.dispatch(this.request);
        } catch (error) {
            return this.getResponse(InternalServerError, String(error));
        }
    }

    protected async dispatch(request: Request): Promise<Response> {
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

    protected async getCachedResponse(): Promise<Response | undefined> {
        if (this.request.method !== Method.GET) return;

        return await caches.default.match(this.request.url);
    }

    protected setCachedResponse(response: Response): void {
        if (!response.ok) return;
        if (this.request.method !== Method.GET) return;

        try {
            this.ctx?.waitUntil(caches.default.put(this.request.url, response.clone()));
        } catch (e) {
            console.warn("Failed to cache response:", e);
        }
    }

    protected async getResponse<T extends WorkerResponse>(
        ResponseClass: new (cors: CorsProvider, ...args: any[]) => T,
        ...args: any[]
    ): Promise<Response> {
        const response = new ResponseClass(this, ...args).createResponse();
        this.setCachedResponse(response);
        return response;
    }

    public isAllowed(method: string): boolean {
        return isMethod(method) && this.getAllowMethods().includes(method);
    }

    public getAllowOrigins(): string[] {
        return ["*"];
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
