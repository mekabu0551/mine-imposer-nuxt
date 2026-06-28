import { defineConfig } from "vize";

export default defineConfig({
  linter: { preset: "opinionated" },
  lsp: { lint: true },
  compiler: { sourceMap: true }
});
