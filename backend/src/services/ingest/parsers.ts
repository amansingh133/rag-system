// File parsers. Each returns plain text.
// pdf-parse: imported via the internal path to avoid a known issue where
// the package's index.js tries to read a test PDF at require-time.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function extractText(filePath: string, mimeType: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  // PDF
  if (mimeType === 'application/pdf' || ext === '.pdf') {
    const buf = await fs.readFile(filePath);
    const result = await pdfParse(buf);
    return result.text || '';
  }

  // DOCX
  if (
    mimeType.includes('officedocument.wordprocessingml') ||
    ext === '.docx'
  ) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  }

  // XLSX / XLS
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    ext === '.xlsx' ||
    ext === '.xls'
  ) {
    const wb = XLSX.readFile(filePath);
    const lines: string[] = [];
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      lines.push(`### Sheet: ${sheetName}`);
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      for (const row of rows) {
        const parts = Object.entries(row).map(([k, v]) => `${k}: ${v}`);
        lines.push(parts.join(' | '));
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  // CSV — read as text. Each row becomes a line that the chunker can split.
  if (ext === '.csv' || mimeType === 'text/csv') {
    return await fs.readFile(filePath, 'utf8');
  }

  // Plain text / Markdown
  if (
    ext === '.txt' ||
    ext === '.md' ||
    ext === '.markdown' ||
    mimeType.startsWith('text/')
  ) {
    return await fs.readFile(filePath, 'utf8');
  }

  throw new Error(`Unsupported file type: ${mimeType || ext}`);
}
