import js from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    ignores: ["**/.next/**", "**/dist/**", "**/node_modules/**"],
  },
  {
    rules: {
      "@typescript-eslint/no-unsafe-function-type": "off",
    },
  },
];
