import { Router } from 'express';
import { answerQuestion } from '../services/chat/chatService.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Missing or empty query' });
    }
    const result = await answerQuestion(query.trim());
    res.json(result);
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'Chat failed' });
  }
});

export default router;
