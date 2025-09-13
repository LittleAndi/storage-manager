import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    test: {
        environment: "jsdom",
        setupFiles: [],
        globals: true,
        include: ["src/__tests__/**/*.test.ts"],
        coverage: {
            reporter: ["text", "html"],
        },
    },
});
