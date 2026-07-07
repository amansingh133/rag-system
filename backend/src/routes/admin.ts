import { Router } from 'express';
import { resetEverything } from '../services/reset.js';

const router = Router();

router.post('/reset', async (_req, res) => {
  try {
    const result = await resetEverything();
    res.json(result);
  } catch (err: any) {
    console.error('Reset error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
