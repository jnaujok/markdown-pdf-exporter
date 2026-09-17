import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/codeSpanLayout.ts",
        "src/csp.ts",
        "src/diagramLayout.ts",
        "src/documentCss.ts",
        "src/imagePath.ts",
        "src/mermaidCatalog.ts",
        "src/mermaidConfig.ts",
        "src/mermaidFences.ts",
        "src/mermaidKind.ts",
        "src/mermaidSupport.ts",
        "src/nonce.ts",
        "src/sanitizeHtml.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
