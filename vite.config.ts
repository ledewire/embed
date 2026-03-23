import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const target = process.env.BUILD_TARGET || "vimeo";

let entry = path.resolve(__dirname, "src/entries/vimeo-blocker.tsx");
let fileName = (format: string) => `vimeo-blocker.${format}.js`;

if (target === "page") {
  entry = path.resolve(__dirname, "src/entries/page-blocker.tsx");
  fileName = (format: string) => `page-blocker.${format}.js`;
}

// Plugin to rewrite index.html script source
const htmlPlugin = () => {
  return {
    name: "html-transform",
    transformIndexHtml(html: string) {
      // If we are in page mode, replace vimeo entry with page entry
      // If we are in vimeo mode, ensure we point to vimeo entry (which we update index.html to do by default)

      // We'll update the regex to catch whatever is currently in index.html for main entry
      // and replace it with the selected target entry.
      // Currently index.html points to /src/main.tsx.
      // We will assume index.html is updated to point to one of them, or we catch match against main.tsx if mistakenly left.

      const newEntry =
        target === "page"
          ? "/src/entries/page-blocker.tsx"
          : "/src/entries/vimeo-blocker.tsx";
      return html
        .replace(/\/src\/main\.tsx/g, newEntry)
        .replace(/\/src\/entries\/vimeo-blocker\.tsx/g, newEntry)
        .replace(/\/src\/entries\/page-blocker\.tsx/g, newEntry);
    },
  };
};

export default defineConfig({
  plugins: [preact(), htmlPlugin()],
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
    },
  },
  build: {
    emptyOutDir: false, // Allow building both without wiping
    lib: {
      entry: entry,
      name: "LedeWire",
      fileName: fileName,
      formats: ["iife"],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
    minify: "terser",
  },
  server: {
    open: "/index.html",
  },
  test: {
    globals: true,
    environment: "happy-dom",
    pool: "threads",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/test/", "**/*.d.ts", "**/*.config.*"],
    },
  },
});
