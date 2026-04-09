/**
 * Media Proxy Router
 * Fornece endpoints para proxy de mídia do Facebook CDN
 * Evita problemas de CORS, hotlinking e expira URLs
 */

import { Router } from 'express';
import axios from 'axios';
import { logger } from './_core/logger';
import { appCache } from './_core/cache';

const router = Router();

/**
 * GET /api/proxy/media/:type/:hash
 * 
 * Tipos: video, image
 * Hash: hash da URL original (para evitar exposição direta)
 */
router.get('/media/:type/:hash', async (req, res) => {
  try {
    const { type, hash } = req.params;

    // Validar tipo
    if (!['video', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de mídia inválido' });
    }

    // Recuperar URL do cache (mapeamento hash -> URL)
    const cacheKey = `media:${hash}`;
    const originalUrl = appCache.get<string>(cacheKey);

    if (!originalUrl) {
      logger.warn('[MediaProxy] URL não encontrada no cache', { hash });
      return res.status(404).json({ error: 'Mídia não encontrada' });
    }

    // Validar que é uma URL do Facebook CDN
    if (!originalUrl.includes('fbcdn.net') && !originalUrl.includes('facebook.com')) {
      logger.warn('[MediaProxy] URL não autorizada', { hash, url: originalUrl.substring(0, 50) });
      return res.status(403).json({ error: 'URL não autorizada' });
    }

    // Fazer requisição para o CDN do Facebook
    const response = await axios.get(originalUrl, {
      responseType: type === 'video' ? 'stream' : 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://facebook.com/',
      },
      maxRedirects: 5,
    });

    // Definir headers de resposta
    const contentType = type === 'video' ? 'video/mp4' : response.headers['content-type'] || 'image/jpeg';
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400', // 24 horas
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
    });

    // Enviar mídia
    if (type === 'video') {
      response.data.pipe(res);
    } else {
      res.send(response.data);
    }

    logger.debug('[MediaProxy] Mídia servida', { type, hash });
  } catch (error: any) {
    logger.error('[MediaProxy] Erro ao servir mídia', {
      hash: req.params.hash,
      error: error.message,
    });

    res.status(500).json({ error: 'Erro ao servir mídia' });
  }
});

/**
 * POST /api/proxy/register
 * Registra uma URL de mídia e retorna um hash para proxy
 */
router.post('/register', async (req, res) => {
  try {
    const { url, type } = req.body;

    if (!url || !type) {
      return res.status(400).json({ error: 'URL e tipo são obrigatórios' });
    }

    if (!['video', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Tipo inválido' });
    }

    // Validar que é uma URL do Facebook CDN
    if (!url.includes('fbcdn.net') && !url.includes('facebook.com')) {
      return res.status(403).json({ error: 'URL não autorizada' });
    }

    // Gerar hash da URL
    const hash = Buffer.from(url).toString('base64').substring(0, 16);

    // Armazenar no cache por 24 horas
    appCache.set(`media:${hash}`, url, 24 * 60 * 60 * 1000);

    logger.debug('[MediaProxy] URL registrada', { type, hash });

    res.json({
      hash,
      proxyUrl: `/api/proxy/media/${type}/${hash}`,
    });
  } catch (error: any) {
    logger.error('[MediaProxy] Erro ao registrar URL', { error: error.message });
    res.status(500).json({ error: 'Erro ao registrar URL' });
  }
});

export default router;
