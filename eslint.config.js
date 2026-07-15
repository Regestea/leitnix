import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    ignores: [
      "dist",
      "node_modules",
      "android",
      "ios",
      "build",
      "find-unused-css.mjs",
      "**/*.min.js",
      "**/assets/**",
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    files: ["src/**/*.{ts,tsx}"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },

    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },

    rules: {
      // React 19 hooks rules
      ...reactHooks.configs.flat.recommended.rules,

      // Vite React Fast Refresh
      ...reactRefresh.configs.vite.rules,

      // Unused variables
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Force type-only imports
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],

      // Project preferences
      "@typescript-eslint/no-explicit-any": "off",

      "no-console": "off",

      "no-debugger": "warn",
    },
  }
);