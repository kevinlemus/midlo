import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reactPath = path.resolve(__dirname, "node_modules/react");
const reactDomPath = path.resolve(__dirname, "node_modules/react-dom");

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Critical for monorepos: prevent multiple React copies (causes ReactCurrentDispatcher undefined)
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    alias: {
      react: reactPath,
      "react-dom": reactDomPath,
      "react/jsx-runtime": path.join(reactPath, "jsx-runtime"),
      "react/jsx-dev-runtime": path.join(reactPath, "jsx-dev-runtime"),
    },
  },
});
