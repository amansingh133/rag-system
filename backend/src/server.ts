import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "./config/env.js";
import { initMySQL } from "./config/mysql.js";
import { runMigrations } from "./config/migrate.js";
import { initMongo } from "./config/mongodb.js";
import documentsRouter from "./routes/documents.js";
import chatRouter from "./routes/chat.js";
import adminRouter from "./routes/admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  await initMySQL();
  await runMigrations();
  await initMongo();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/documents", documentsRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/admin", adminRouter);

  // ── Serve React build (Single Page Application / CSR) ──────────────────────────────────
  const PUBLIC_DIR = path.join(__dirname, "public");
  app.use(
    express.static(PUBLIC_DIR, {
      maxAge: process.env.NODE_ENV === "production" ? "1d" : 0,
      setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
      },
    }),
  );

  // React Router catch-all — must be AFTER API routes
  app.get("*", (req, res) => {
    const indexPath = path.join(PUBLIC_DIR, "index.html");
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(404).json({
          error: "Frontend not built yet.",
          fix: "Run: cd frontend && npm run build",
        });
      }
    });
  });

  // Generic error handler
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  });

  app.listen(env.PORT, () => {
    console.log(`Server on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error("Startup failed:", err);
  process.exit(1);
});
