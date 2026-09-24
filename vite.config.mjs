import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(projectRoot, "src/web");

export default defineConfig({
  root,
  publicDir: path.join(root, "assets"),
  server: {
    host: "127.0.0.1",
    fs: { allow: [root] },
  },
  build: {
    outDir: path.join(projectRoot, "dist"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        index: path.join(root, "index.html"),
      },
    },
  },
  plugins: [
    {
      name: "rba-private-path-guard",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
          const parts = pathname.split("/").filter(Boolean);
          const privateRoot = new Set([
            ".git",
            ".github",
            "docs",
            "godot",
            "public",
            "web",
            "tools",
            "src",
            "tests",
            "README.md",
            "CONTRIBUTING.md",
            "package.json",
            "package-lock.json",
            "server.js",
            "server.py",
            "vercel.json",
            "vite.config.mjs",
            "playwright.config.js",
            "tsconfig.json",
            "eslint.config.mjs",
          ]);
          const viteDeps = pathname.startsWith("/node_modules/.vite/");
          if (
            (!viteDeps && parts.some((part) => part.startsWith("."))) ||
            privateRoot.has(parts[0])
          ) {
            res.writeHead(403, { "Content-Type": "text/plain" });
            res.end("403 Forbidden");
            return;
          }
          next();
        });
      },
    },
  ],
});
