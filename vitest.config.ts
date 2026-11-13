import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 15000,
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    exclude: ["node_modules", ".next", "coverage"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        ".next/**",
        "src/**/*.d.ts",
        "src/app/layout.tsx",
        "src/app/page.tsx",
        "src/app/globals.css",
      ],
    },
    env: {
      NODE_ENV: "test",
      JWT_ACCESS_SECRET: "test-access-secret-at-least-32-characters-for-testing",
      JWT_REFRESH_SECRET: "test-refresh-secret-at-least-32-characters-for-testing",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

