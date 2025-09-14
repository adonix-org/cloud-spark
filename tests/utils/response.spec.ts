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

import { MediaType } from "@src/constants/media-types";
import { getContentType } from "@src/utils/response";
import { describe, it, expect } from "vitest";

describe("response functions unit tests", () => {
    describe("get content type function", () => {
        it("adds the charset to json", () => {
            expect(getContentType(MediaType.JSON)).toBe("application/json; charset=utf-8");
        });

        it("adds the charset to plain text", () => {
            expect(getContentType(MediaType.PLAIN_TEXT)).toBe("text/plain; charset=utf-8");
        });

        it("adds the charset to html", () => {
            expect(getContentType(MediaType.HTML)).toBe("text/html; charset=utf-8");
        });

        it("does not add charset for binary type", () => {
            expect(getContentType(MediaType.OCTET_STREAM)).toBe("application/octet-stream");
        });
    });
});
