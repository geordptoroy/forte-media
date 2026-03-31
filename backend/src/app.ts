import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import adsRoutes from './routes/ads';
import searchRoutes from './routes/search';
import favoritesRoutes from './routes/favorites';
import monitoringRoutes from './routes/monitoring';
import reportsRoutes from './routes/reports';
import syncRoutes from './routes/sync';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/sync', syncRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

export default app;
