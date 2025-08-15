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

import { getReasonPhrase, StatusCodes } from "http-status-codes";
import { isMethod, Method } from "./common";
import {
    Head,
    MethodNotAllowed,
    NotImplemented,
    Options,
    InternalServerError,
    CorsProvider,
} from "./result";

export abstract class WorkerBase implements CorsProvider {
    constructor(
        protected readonly env: Env,
        protected readonly ctx?: ExecutionContext
    ) {}

    public async fetch(request: Request): Promise<Response> {
        if (!this.isAllowed(request.method)) {
            return new MethodNotAllowed(this, request.method).response;
        }

        try {
            switch (request.method) {
                case Method.GET:
                    return await this.get(request);
                case Method.PUT:
                    return await this.put(request);
                case Method.POST:
                    return await this.post(request);
                case Method.PATCH:
                    return await this.patch(request);
                case Method.DELETE:
                    return await this.delete(request);
                case Method.HEAD:
                    return await this.head(request);
                case Method.OPTIONS:
                    return await this.options();
                default:
                    return new MethodNotAllowed(this, request.method).response;
            }
        } catch (error) {
            return new InternalServerError(this, String(error)).response;
        }
    }

    protected async get(_request: Request): Promise<Response> {
        return new NotImplemented(this).response;
    }

    protected async put(_request: Request): Promise<Response> {
        return new NotImplemented(this).response;
    }

    protected async post(_request: Request): Promise<Response> {
        return new NotImplemented(this).response;
    }

    protected async patch(_request: Request): Promise<Response> {
        return new NotImplemented(this).response;
    }

    protected async delete(_request: Request): Promise<Response> {
        return new NotImplemented(this).response;
    }

    protected async options(): Promise<Response> {
        return new Options(this).response;
    }

    protected async head(request: Request): Promise<Response> {
        return new Head(this, await this.get(request)).response;
    }

    protected getError(code: StatusCodes, detail?: string): string {
        return JSON.stringify({
            code,
            error: getReasonPhrase(code),
            detail: detail,
        });
    }

    public getAllowOrigin(): string {
        return "*";
    }

    public getAllowMethods(): Method[] {
        return [Method.GET, Method.OPTIONS, Method.HEAD];
    }

    private isAllowed(method: string): boolean {
        return isMethod(method) && this.getAllowMethods().includes(method);
    }

    public getAllowHeaders(): string[] {
        return ["Content-Type"];
    }
}
