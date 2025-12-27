import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";
import globals from "globals";

export default [
  // Global ignore patterns (replaces .eslintignore)
  {
    ignores: [
      ".vscode/",
      "dist/",
      "node_modules/",
      "public/",
      ".astro/",
      "pnpm-lock.yaml",
    ],
  },

  // ESLint recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Global configuration for all files
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,      // Node.js globals (replaces env.node)
        ...globals.browser,   // Browser globals (replaces env.browser)
        ...globals.es2024,    // ES2024 globals (replaces env.es2024)
      },
    },
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double", { allowTemplateLiterals: true }],
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },

  // Astro recommended rules
  ...eslintPluginAstro.configs.recommended,

  // Astro-specific parser configuration
  {
    files: ["**/*.astro"],
    languageOptions: {
      parser: eslintPluginAstro.parser,
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".astro"],
      },
    },
  },
];
