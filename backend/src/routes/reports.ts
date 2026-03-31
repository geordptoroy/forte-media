import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/export', (req: Request, res: Response) => {
  const { period, format, metrics } = req.body;
  return res.json({
    success: true,
    url: `https://reports.fortemedia.com/export_${Date.now()}.${format || 'pdf'}`,
    period,
    metrics,
    generated_at: new Date().toISOString(),
  });
});

export default router;
