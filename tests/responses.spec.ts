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
} from "@src/responses";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { CacheControl, HttpHeader } from "@src/common";
import { assertDefined, VALID_URL } from "@constants";
import { MethodNotAllowed } from "@src/errors";

const mockWorker = {
    request: new Request(VALID_URL),
    allowAnyOrigin: vi.fn(() => false),
    getAllowedMethods: vi.fn(() => "GET, HEAD, OPTIONS"),
} as any;

describe("response unit tests", () => {
    it("sets status and body in success response", async () => {
        const resp = new SuccessResponse(mockWorker, "Hello", undefined, StatusCodes.CREATED);
        const r = await resp.getResponse();
        expect(r.status).toBe(StatusCodes.CREATED);
        expect(r.statusText).toBe(getReasonPhrase(StatusCodes.CREATED));
    });

    it("sets json body and content-type in json response", async () => {
        const resp = new JsonResponse(mockWorker, { foo: "bar" });
        const r = await resp.getResponse();
        expect(r.headers.get(HttpHeader.CONTENT_TYPE)).toBe("application/json; charset=utf-8");
        const json = await r.json();
        expect(json).toEqual({ foo: "bar" });
    });

    it("sets content type to text/html in html response", async () => {
        const resp = new HtmlResponse(mockWorker, "<p>Hello</p>");
        const r = await resp.getResponse();
        expect(r.headers.get(HttpHeader.CONTENT_TYPE)).toBe("text/html; charset=utf-8");
        const text = await r.text();
        expect(text).toBe("<p>Hello</p>");
    });

    it("sets content type to text/plain in text response", async () => {
        const resp = new TextResponse(mockWorker, "Hello");
        const r = await resp.getResponse();
        expect(r.headers.get(HttpHeader.CONTENT_TYPE)).toBe("text/plain; charset=utf-8");
        const text = await r.text();
        expect(text).toBe("Hello");
    });

    it("clones response headers and body in cloned response", async () => {
        const original = new Response("Test", {
            headers: { "X-Test": "ok" },
            status: StatusCodes.ACCEPTED,
        });
        const resp = new ClonedResponse(mockWorker, original);
        const r = await resp.getResponse();
        expect(r.status).toBe(StatusCodes.ACCEPTED);
        expect(r.headers.get("X-Test")).toBe("ok");
        expect(await r.text()).toBe("Test");
    });

    it("returns headers but empty body in head response", async () => {
        const original = new Response("Hello", { headers: { "X-Test": "ok" } });
        const resp = new Head(mockWorker, original);
        const r = await resp.getResponse();
        expect(r.headers.get("X-Test")).toBe("ok");
        expect(await r.text()).toBe("");
    });

    it("sets cache header if defined", async () => {
        const cache: CacheControl = { "max-age": 65 };
        const resp = new JsonResponse(mockWorker, { foo: "bar" }, cache);
        const r = await resp.getResponse();

        const h = assertDefined(
            r.headers.get(HttpHeader.CACHE_CONTROL),
            "cache header not defined",
        );

        expect(CacheControl.parse(h)["max-age"]).toBe(65);
    });

    it("correctly merges a value to an existing header", async () => {
        const resp = new MethodNotAllowed(mockWorker);
        resp.mergeHeader(HttpHeader.ALLOW, "DELETE");
        expect(resp.headers.get(HttpHeader.ALLOW)).toBe("DELETE, GET, HEAD, OPTIONS");
    });
});
