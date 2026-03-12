import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: "src",
  plugins: [viteSingleFile()],
  build: {
    outDir: "../dist/ui",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "src/quest-app.html"),
    },
  },
});
