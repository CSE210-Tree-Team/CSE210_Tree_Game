import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        strictPort: true,
        proxy: {
            "/api": {
                target: "http://localhost:8000",
                changeOrigin: true,
                secure: false,
            },
        },
    },
    test: {
        environment: "jsdom",
        setupFiles: "./src/setupTests.ts",
        globals: true,
        // CI runners are memory-constrained; reduce worker count to avoid OOM.
        maxWorkers: process.env.CI ? 1 : undefined,
        minWorkers: process.env.CI ? 1 : undefined,
    },
});
