import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { v4 as uuid } from 'uuid';
import { env } from '../config/env.js';

if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: env.UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
});
