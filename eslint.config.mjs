import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

/*
 * Import direction: app -> components -> features -> lib / data.
 * features, data, stores, hooks and lib never import UI; lib also never
 * imports features or stores (HANDOFF section 5).
 */
const noUi = {
  group: ["@/components/*", "@/app/*", "@/providers/*"],
  message: "Only app/ and components/ may import UI.",
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      "src/features/**/*.{ts,tsx}",
      "src/data/**/*.{ts,tsx}",
      "src/stores/**/*.{ts,tsx}",
      "src/hooks/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": ["error", { patterns: [noUi] }],
    },
  },
  {
    files: ["src/lib/**/*.{ts,tsx}", "src/proxy.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            noUi,
            {
              group: ["@/features/*", "@/stores/*"],
              message: "lib/ stays below features/ and stores/.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
])

export default eslintConfig
