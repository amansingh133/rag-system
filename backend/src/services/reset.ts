import fs from 'node:fs/promises';
import path from 'node:path';
import { getMySQL } from '../config/mysql.js';
import { deleteAllVectors } from './ingest/vectorStore.js';
import { env } from '../config/env.js';

export async function resetEverything() {
  // 1. Delete all vectors from Atlas
  await deleteAllVectors();

  // 2. Truncate MySQL document metadata
  const pool = getMySQL();
  await pool.execute(`DELETE FROM rag_documents`);

  // 3. Wipe upload directory (keep .gitkeep)
  try {
    const files = await fs.readdir(env.UPLOAD_DIR);
    for (const f of files) {
      if (f === '.gitkeep') continue;
      await fs.unlink(path.join(env.UPLOAD_DIR, f)).catch(() => {});
    }
  } catch { /* dir may not exist */ }

  return { ok: true, message: 'All documents and vectors deleted.' };
}
