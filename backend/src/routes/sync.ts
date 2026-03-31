import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/trigger', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    message: 'Sincronização iniciada',
    job_id: `job_${Date.now()}`,
  });
});

router.get('/status', (_req: Request, res: Response) => {
  return res.json({
    status: 'idle',
    last_sync: new Date(Date.now() - 3600000).toISOString(),
    next_sync: new Date(Date.now() + 3600000).toISOString(),
  });
});

export default router;
