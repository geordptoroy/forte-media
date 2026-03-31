import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getMockFavorites } from '../services/mockData';

const router = Router();

router.use(authMiddleware);

router.get('/', (req: Request, res: Response) => {
  return res.json(getMockFavorites(req.user!.userId));
});

router.post('/', (req: Request, res: Response) => {
  const { ad_id, folder_name = 'Geral', notes } = req.body;
  return res.status(201).json({
    id: Math.floor(Math.random() * 10000),
    user_id: req.user!.userId,
    ad_id,
    folder_name,
    notes,
    created_at: new Date().toISOString(),
  });
});

router.delete('/:adId', (_req: Request, res: Response) => {
  return res.json({ success: true });
});

router.patch('/:adId', (req: Request, res: Response) => {
  const { folder_name, notes } = req.body;
  return res.json({ success: true, folder_name, notes });
});

export default router;
