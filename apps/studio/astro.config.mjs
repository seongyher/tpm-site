import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  build: {
    format: "directory",
  },
  compressHTML: true,
  outDir: "../../dist/studio",
  output: "static",
  site: "https://studio.local/",
  trailingSlash: "always",
  vite: {
    plugins: [tailwindcss()],
  },
});
