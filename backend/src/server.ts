import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { initMySQL } from "./config/mysql.js";
import { runMigrations } from "./config/migrate.js";
import { initMongo } from "./config/mongodb.js";
import documentsRouter from "./routes/documents.js";
import chatRouter from "./routes/chat.js";
import adminRouter from "./routes/admin.js";

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
