import puppeteer from 'puppeteer-core';
import { logger } from '../_core/logger';
import { appCache } from '../_core/cache';

/**
 * Ad Extractor Service — Extração profunda de mídia via Headless Browser
 * Burlar bloqueios e proteger o access_token.
 */

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36';

export async function extractDeepMedia(adId: string, accessToken: string) {
  const cacheKey = `ad:media:v1:${adId}`;
  const cached = appCache.get(cacheKey);
  if (cached) return cached;

  const snapshotUrl = `https://www.facebook.com/ads/archive/render_ad/?id=${adId}&access_token=${accessToken}`;
  
  logger.info(`[AdExtractor] Iniciando extração profunda para AdID: ${adId}`);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      headless: true
    });

    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.setViewport({ width: 1280, height: 800 });

    // Navegar para a URL do snapshot
    await page.goto(snapshotUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Aguardar um pouco para garantir que os scripts da Meta carreguem a mídia
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Executar script de extração dentro do contexto da página
    const mediaData = await page.evaluate(() => {
      // Tentar encontrar vídeo
      const video = document.querySelector('video');
      if (video && video.src && video.src.startsWith('http')) {
        return { type: 'video', url: video.src, poster: video.poster };
      }

      // Tentar encontrar imagem de alta resolução (geralmente a maior imagem na página de render)
      const images = Array.from(document.querySelectorAll('img'));
      const largeImage = images.find(img => {
        const src = img.src || '';
        return src.includes('scontent') && !src.includes('1x1');
      });

      if (largeImage) {
        return { type: 'image', url: largeImage.src };
      }

      return null;
    });

    if (mediaData) {
      logger.info(`[AdExtractor] Mídia extraída com sucesso para ${adId}: ${mediaData.type}`);
      appCache.set(cacheKey, mediaData, 24 * 60 * 60 * 1000); // Cache de 24 horas
      return mediaData;
    }

    logger.warn(`[AdExtractor] Nenhuma mídia encontrada para ${adId}`);
    return null;

  } catch (error: any) {
    logger.error(`[AdExtractor] Erro na extração para ${adId}: ${error.message}`);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}
