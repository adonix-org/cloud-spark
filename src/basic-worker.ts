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
            switch (this.request.method) {
                case Method.GET:
                    return await this.get();
                case Method.PUT:
                    return await this.put();
                case Method.POST:
                    return await this.post();
                case Method.PATCH:
                    return await this.patch();
                case Method.DELETE:
                    return await this.delete();
                case Method.HEAD:
                    return await this.head();
                case Method.OPTIONS:
                    return await this.options();
                default:
                    return this.getResponse(
                        MethodNotAllowed,
                        this.request.method
                    );
            }
        } catch (error) {
            return this.getResponse(InternalServerError, String(error));
        }
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
        return this.getResponse(Head, await this.get());
    }

    protected getResponse<
        T extends WorkerResponse,
        Ctor extends new (cors: CorsProvider, ...args: any[]) => T
    >(
        ResponseClass: Ctor,
        ...args: ConstructorParameters<Ctor> extends [any, ...infer R]
            ? R
            : never
    ): Response {
        return new ResponseClass(this, ...args).createResponse();
    }

    public getAllowOrigins(): string[] {
        return ["*"];
    }

    public getAllowMethods(): Method[] {
        return [Method.GET, Method.OPTIONS, Method.HEAD];
    }

    public isAllowed(method: string): boolean {
        return isMethod(method) && this.getAllowMethods().includes(method);
    }

    public getAllowHeaders(): string[] {
        return ["Content-Type"];
    }

    public getMaxAge(): number {
        return Time.Day;
    }

    public getOrigin(): string | null {
        return this.request.headers.get("Origin");
    }
}
