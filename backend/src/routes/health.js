import { Router } from 'express';

const router = Router();

/**
 * GET /api/health
 * Liveness probe used by the frontend to prove the two halves are wired together.
 * @returns {{status: string}} Always {"status": "ok"} when the server is up.
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;
