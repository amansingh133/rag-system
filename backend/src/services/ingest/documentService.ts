import { v4 as uuid } from 'uuid';
import { Document } from '@langchain/core/documents';
import fs from 'node:fs/promises';
import { getMySQL } from '../../config/mysql.js';
import { extractText } from './parsers.js';
import { chunkText } from './chunker.js';
import { addChunks, deleteByDocumentId } from './vectorStore.js';

export interface UploadedFile {
  originalName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}

export async function ingestDocument(file: UploadedFile) {
  const documentId = uuid();
  const pool = getMySQL();

  await pool.execute(
    `INSERT INTO rag_documents
     (id, original_filename, storage_path, mime_type, file_size_bytes, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [documentId, file.originalName, file.storagePath, file.mimeType, file.sizeBytes],
  );

  try {
    // Parse
    await pool.execute(`UPDATE rag_documents SET status='parsing' WHERE id=?`, [documentId]);
    const text = await extractText(file.storagePath, file.mimeType);
    if (!text.trim()) {
      throw new Error('No text could be extracted from this file (it may be a scanned PDF or empty)');
    }

    // Chunk
    await pool.execute(`UPDATE rag_documents SET status='indexing' WHERE id=?`, [documentId]);
    const chunks = await chunkText(text);
    if (chunks.length === 0) {
      throw new Error('Text was extracted but produced zero chunks');
    }

    // Embed + store
    const docs = chunks.map((content, idx) => new Document({
      pageContent: content,
      metadata: {
        documentId,
        chunkIndex: idx,
        filename: file.originalName,
        mimeType: file.mimeType,
      },
    }));

    await addChunks(docs);

    await pool.execute(
      `UPDATE rag_documents
       SET status='indexed', chunk_count=?, indexed_at=NOW()
       WHERE id=?`,
      [chunks.length, documentId],
    );

    return { documentId, chunkCount: chunks.length };
  } catch (err: any) {
    const msg = String(err?.message || err).slice(0, 1000);
    await pool.execute(
      `UPDATE rag_documents SET status='failed', error_message=? WHERE id=?`,
      [msg, documentId],
    );
    throw err;
  }
}

export async function listDocuments() {
  const pool = getMySQL();
  const [rows] = await pool.execute(
    `SELECT id, original_filename, mime_type, file_size_bytes, status,
            chunk_count, error_message, created_at, indexed_at
     FROM rag_documents
     ORDER BY created_at DESC`,
  );
  return rows;
}

export async function deleteDocument(documentId: string) {
  const pool = getMySQL();
  const [rows] = await pool.execute(
    `SELECT storage_path FROM rag_documents WHERE id=?`,
    [documentId],
  );
  const docs = rows as Array<{ storage_path: string }>;
  if (docs.length > 0 && docs[0].storage_path) {
    try { await fs.unlink(docs[0].storage_path); } catch { /* ignore */ }
  }
  await deleteByDocumentId(documentId);
  await pool.execute(`DELETE FROM rag_documents WHERE id=?`, [documentId]);
}
