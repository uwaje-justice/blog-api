import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["dist/**", "node_modules/**"],
    passWithNoTests: true,
    env: {
      DATABASE_URL: "postgresql://user:password@localhost:5432/mydb?schema=public",
      JWT_SECRET: "test-secret",
    },
  },
});
