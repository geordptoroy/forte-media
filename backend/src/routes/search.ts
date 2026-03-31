import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { MOCK_ADS } from '../services/mockData';
import { SearchFilters } from '../types';

const router = Router();
const savedSearches: Array<{ id: number; name: string; filters: SearchFilters }> = [];

router.use(authMiddleware);

router.post('/', (req: Request, res: Response) => {
  const filters: SearchFilters = req.body;
  const { page = 1, limit = 12 } = req.body;

  let ads = [...MOCK_ADS];

  if (filters.keywords) {
    const kw = filters.keywords.toLowerCase();
    ads = ads.filter((ad) => ad.page_name.toLowerCase().includes(kw));
  }

  if (filters.media_type) {
    ads = ads.filter((ad) => ad.media_type === filters.media_type);
  }

  if (filters.score_min) {
    ads = ads.filter((ad) => ad.score >= Number(filters.score_min));
  }

  const total = ads.length;
  const start = (Number(page) - 1) * Number(limit);
  const data = ads.slice(start, start + Number(limit));

  return res.json({
    data,
    total,
    page: Number(page),
    limit: Number(limit),
    total_pages: Math.ceil(total / Number(limit)),
  });
});

router.post('/save', (req: Request, res: Response) => {
  const { name, filters } = req.body;
  const newSearch = { id: savedSearches.length + 1, name, filters };
  savedSearches.push(newSearch);
  return res.status(201).json(newSearch);
});

router.get('/saved', (_req: Request, res: Response) => {
  return res.json(savedSearches);
});

export default router;
