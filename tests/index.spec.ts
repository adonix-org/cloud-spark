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

import { describe, expect, it } from "vitest";
import * as IndexExports from "../src/index";
import { lexCompare } from "../src/common";

describe("library export tests", () => {
    it("does not export the internal env type", () => {
        const exportedKeys = Object.keys(IndexExports);
        expect(exportedKeys).not.toContain("Env");
    });

    it("ensures that no exported symbol is undefined", () => {
        Object.entries(IndexExports).forEach(([_key, value]) => {
            expect(value).not.toBeUndefined();
        });
    });

    it("matches the exported symbols snapshot", () => {
        const keys = Object.keys(IndexExports).sort(lexCompare);
        expect(keys).toMatchSnapshot();
    });
});
