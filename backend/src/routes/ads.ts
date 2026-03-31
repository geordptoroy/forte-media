import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { MOCK_ADS, getMockAdHistory } from '../services/mockData';

const router = Router();

router.use(authMiddleware);

router.post('/scaled', (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 12,
    search = '',
    page_name = '',
    spend_min,
    spend_max,
    score_min = 0,
  } = req.body;

  let ads = MOCK_ADS.filter((ad) => ad.is_scaled);

  if (search) {
    ads = ads.filter((ad) =>
      ad.page_name.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (page_name) {
    ads = ads.filter((ad) =>
      ad.page_name.toLowerCase().includes(page_name.toLowerCase())
    );
  }

  if (score_min) {
    ads = ads.filter((ad) => ad.score >= Number(score_min));
  }

  const total = ads.length;
  const start = (Number(page) - 1) * Number(limit);
  const end = start + Number(limit);
  const data = ads.slice(start, end);

  return res.json({
    data,
    total,
    page: Number(page),
    limit: Number(limit),
    total_pages: Math.ceil(total / Number(limit)),
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const ad = MOCK_ADS.find((a) => a.id === req.params.id);
  if (!ad) {
    return res.status(404).json({ error: 'Anúncio não encontrado' });
  }
  return res.json(ad);
});

router.get('/:id/history', (req: Request, res: Response) => {
  return res.json(getMockAdHistory(req.params.id));
});

export default router;
