import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy Azure Functions API calls to the local Functions runtime.
      // Run: cd api && func start  (or use: swa start)
      "/api": {
        target: "http://localhost:7071",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Vite 8 builds with Rolldown by default. Rolldown's rollupOptions is an
    // alias kept only for compatibility, and the object form of
    // `output.manualChunks` is no longer supported (Rollup-only). Use
    // Rolldown's native `rolldownOptions.output.codeSplitting.groups` API
    // instead: https://rolldown.rs/in-depth/manual-code-splitting
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react",
              test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
            },
            {
              name: "forms",
              test: /[\\/]node_modules[\\/](react-hook-form|@hookform[\\/]resolvers|zod)[\\/]/,
            },
            {
              name: "ui",
              test: /[\\/]node_modules[\\/](@radix-ui[\\/]react-alert-dialog|@radix-ui[\\/]react-avatar|@radix-ui[\\/]react-dialog|@radix-ui[\\/]react-icons|@radix-ui[\\/]react-label|@radix-ui[\\/]react-select|@radix-ui[\\/]react-slot|lucide-react)[\\/]/,
            },
            {
              name: "data",
              test: /[\\/]node_modules[\\/](@supabase[\\/]supabase-js|zustand)[\\/]/,
            },
          ],
        },
      },
    },
  },
});
