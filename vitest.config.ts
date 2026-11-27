import "dotenv/config";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    exclude: ["dist/**", "node_modules/**"],
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
      JWT_SECRET: "test-secret-test-secret-test-secret",
    },
  },
});
