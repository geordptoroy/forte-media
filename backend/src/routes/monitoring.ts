import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getMockMonitoring, getMockAdHistory } from '../services/mockData';

const router = Router();

router.use(authMiddleware);

router.get('/', (req: Request, res: Response) => {
  return res.json(getMockMonitoring(req.user!.userId));
});

router.post('/', (req: Request, res: Response) => {
  const { ad_id, alert_config } = req.body;
  return res.status(201).json({
    id: Math.floor(Math.random() * 10000),
    user_id: req.user!.userId,
    ad_id,
    alert_config,
    created_at: new Date().toISOString(),
  });
});

router.delete('/:adId', (_req: Request, res: Response) => {
  return res.json({ success: true });
});

router.post('/alerts', (req: Request, res: Response) => {
  const { ad_id, alert_config } = req.body;
  return res.json({ success: true, ad_id, alert_config });
});

router.get('/:adId/history', (req: Request, res: Response) => {
  return res.json(getMockAdHistory(req.params.adId));
});

export default router;
