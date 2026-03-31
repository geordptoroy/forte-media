import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getMockDashboardStats,
  getMockChartData,
  getMockTopAdvertisers,
  getMockRecentAds,
} from '../services/mockData';

const router = Router();

router.use(authMiddleware);

router.get('/stats', (_req: Request, res: Response) => {
  return res.json(getMockDashboardStats());
});

router.get('/chart', (_req: Request, res: Response) => {
  return res.json(getMockChartData());
});

router.get('/top-advertisers', (_req: Request, res: Response) => {
  return res.json(getMockTopAdvertisers());
});

router.get('/recent', (_req: Request, res: Response) => {
  return res.json(getMockRecentAds());
});

export default router;
