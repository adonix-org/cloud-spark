import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import importPlugin from "eslint-plugin-import";

export default defineConfig([
    {
        ignores: ["tests/**.*"],
    },
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        plugins: { js, import: importPlugin },
        extends: ["js/recommended"],
        languageOptions: { globals: globals.browser },
        rules: {
            "import/order": [
                "error",
                {
                    groups: [
                        "builtin",
                        "external",
                        "internal",
                        "parent",
                        "sibling",
                        "index",
                        "object",
                        "type",
                    ],
                    "newlines-between": "always",
                    alphabetize: { order: "asc", caseInsensitive: true },
                },
            ],
            "sort-imports": [
                "error",
                {
                    ignoreDeclarationSort: true, // leave import statements order to `import/order`
                    ignoreCase: true,
                    memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
                    allowSeparatedGroups: false,
                },
            ],
        },
    },
    tseslint.configs.recommended,
]);
