import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getMySQL } from "./mysql.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function runMigrations(): Promise<void> {
  const schemaPath = path.resolve(__dirname, "../../schema.sql");
  const raw = await fs.readFile(schemaPath, "utf8");

  // Strip line comments, then split on semicolons
  const cleaned = raw
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  const statements = cleaned
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const pool = getMySQL();
  for (const stmt of statements) {
    await pool.query(stmt);
  }
  console.log(
    `Schema applied (${statements.length} statement${statements.length === 1 ? "" : "s"})`,
  );
}
