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

import { describe, it, expect, vi } from "vitest";
import {
    SuccessResponse,
    JsonResponse,
    HtmlResponse,
    TextResponse,
    ClonedResponse,
    Head,
    Options,
} from "../src/response";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { CacheControl, HttpHeader } from "../src/common";
import { VALID_URL } from "./constants";

// Mock CorsWorker
const mockWorker = {
    request: new Request(VALID_URL),
    allowAnyOrigin: vi.fn(() => false),
    getAllowMethods: vi.fn(() => "GET, HEAD, OPTIONS"),
} as any;

describe("WorkerResponse and subclasses", () => {
    it("SuccessResponse sets status and body", () => {
        const resp = new SuccessResponse(mockWorker, "Hello", undefined, StatusCodes.CREATED);
        const r = resp.createResponse();
        expect(r.status).toBe(StatusCodes.CREATED);
        expect(r.statusText).toBe(getReasonPhrase(StatusCodes.CREATED));
    });

    it("JsonResponse sets JSON body and Content-Type", async () => {
        const resp = new JsonResponse(mockWorker, { foo: "bar" });
        const r = resp.createResponse();
        expect(r.headers.get(HttpHeader.CONTENT_TYPE)).toBe("application/json; charset=utf-8");
        const json = await r.json();
        expect(json).toEqual({ foo: "bar" });
    });

    it("HtmlResponse sets Content-Type to text/html", async () => {
        const resp = new HtmlResponse(mockWorker, "<p>Hello</p>");
        const r = resp.createResponse();
        expect(r.headers.get(HttpHeader.CONTENT_TYPE)).toBe("text/html; charset=utf-8");
        const text = await r.text();
        expect(text).toBe("<p>Hello</p>");
    });

    it("TextResponse sets Content-Type to text/plain", async () => {
        const resp = new TextResponse(mockWorker, "Hello");
        const r = resp.createResponse();
        expect(r.headers.get(HttpHeader.CONTENT_TYPE)).toBe("text/plain; charset=utf-8");
        const text = await r.text();
        expect(text).toBe("Hello");
    });

    it("ClonedResponse clones headers and body", async () => {
        const original = new Response("Test", {
            headers: { "X-Test": "ok" },
            status: StatusCodes.ACCEPTED,
        });
        const resp = new ClonedResponse(mockWorker, original);
        const r = resp.createResponse();
        expect(r.status).toBe(StatusCodes.ACCEPTED);
        expect(r.headers.get("X-Test")).toBe("ok");
        expect(await r.text()).toBe("Test");
    });

    it("Head copies headers but has no body", async () => {
        const original = new Response("Hello", { headers: { "X-Test": "ok" } });
        const resp = new Head(mockWorker, original);
        const r = resp.createResponse();
        expect(r.headers.get("X-Test")).toBe("ok");
        expect(await r.text()).toBe(""); // no body
    });

    it("Options sets status NO_CONTENT and Allow header", () => {
        const resp = new Options(mockWorker);
        const r = resp.createResponse();
        expect(r.status).toBe(StatusCodes.NO_CONTENT);
        expect(r.headers.get(HttpHeader.ALLOW)).toBe("GET, HEAD, OPTIONS");
    });

    it("WorkerResponse adds security header X-Content-Type-Options", () => {
        const resp = new SuccessResponse(mockWorker);
        const r = resp.createResponse();
        expect(r.headers.get(HttpHeader.X_CONTENT_TYPE_OPTIONS)).toBe(HttpHeader.NOSNIFF);
    });

    it("Cache headers are set if provided", () => {
        const cache: CacheControl = { "max-age": 65 };
        const resp = new JsonResponse(mockWorker, { foo: "bar" }, cache);
        const r = resp.createResponse();
        expect(CacheControl.parse(r.headers.get(HttpHeader.CACHE_CONTROL)!)["max-age"]).toBe(65);
    });
});
