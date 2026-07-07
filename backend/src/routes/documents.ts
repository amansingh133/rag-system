import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import {
  ingestDocument,
  listDocuments,
  deleteDocument,
} from '../services/ingest/documentService.js';

const router = Router();

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const result = await ingestDocument({
      originalName: req.file.originalname,
      storagePath: req.file.path,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    });
    res.json({ ok: true, ...result });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

router.get('/', async (_req, res) => {
  try {
    const docs = await listDocuments();
    res.json(docs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteDocument(req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
