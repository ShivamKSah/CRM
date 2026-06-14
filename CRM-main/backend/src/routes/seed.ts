import { Router } from 'express';
import { runSeed } from '../seed.js';

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const result = await runSeed();

    if (result.skipped) {
      return res.json({
        message: result.message,
        customers: result.customers,
        orders: 0,
        segments: 0,
      });
    }

    res.json({
      message: result.message,
      customers: result.customers,
      orders: result.orders,
      segments: result.segments,
    });
  } catch (err) {
    console.error('Seed generation error:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate seed data';
    res.status(500).json({ error: message });
  }
});

export default router;
