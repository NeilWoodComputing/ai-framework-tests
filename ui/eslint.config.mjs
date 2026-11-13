// ESLint flat config (pre-handoff-checks T-GATE-001, plan D2).
// next/core-web-vitals + next/typescript through FlatCompat; uses packages already installed
// (eslint-config-next brings @eslint/eslintrc, typescript-eslint and the Next / React plugins).
// e2e/ is Test Bot's separate package: secrets-scanned by the gate, not linted here (D11).
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".next*/**",
      "node_modules/**",
      "e2e/**",
      "coverage/**",
      "out/**",
      "build/**",
      "dist/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
