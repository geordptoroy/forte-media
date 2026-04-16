import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import axios from 'axios';

// Configurar o plugin stealth
puppeteer.use(StealthPlugin());

export interface ExtractionResult {
  type: 'video' | 'image' | 'carousel' | 'unknown';
  url: string | string[];
  thumbnail?: string;
}

// Cache simples em memória para evitar re-extrações na mesma sessão do servidor
const extractionCache = new Map<string, { result: ExtractionResult, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutos

export class StealthExtractorService {
  private static userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36'
  ];

  static async extractMedia(snapshotUrl: string): Promise<ExtractionResult | null> {
    // 1. Verificar Cache
    const cached = extractionCache.get(snapshotUrl);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log(`[StealthExtractor] Cache hit para: ${snapshotUrl}`);
      return cached.result;
    }

    console.log(`[StealthExtractor] Iniciando extração otimizada para: ${snapshotUrl}`);
    
    // 2. Tentar Extração Ultra-Rápida via Request Simples (Regex no HTML bruto)
    // Isso resolve ~70% dos casos de imagem sem abrir o navegador
    try {
      const response = await axios.get(snapshotUrl, { 
        timeout: 5000,
        headers: { 'User-Agent': this.userAgents[2] }
      });
      const html = response.data;
      
      // Tentar encontrar vídeo no HTML bruto
      const videoMatch = html.match(/https:\/\/video[^"']+\.mp4[^"']*/);
      if (videoMatch) {
        const result: ExtractionResult = {
          type: 'video',
          url: videoMatch[0].replace(/\\/g, '')
        };
        extractionCache.set(snapshotUrl, { result, timestamp: Date.now() });
        return result;
      }

      // Tentar encontrar imagem no HTML bruto
      const imageMatch = html.match(/https:\/\/[^"']+\.fbcdn\.net\/v\/[^"']+\.(?:jpg|png|webp)[^"']*/);
      if (imageMatch && !html.includes('carousel')) { // Evita pegar imagem errada se for carrossel
        const result: ExtractionResult = {
          type: 'image',
          url: imageMatch[0].replace(/\\/g, '')
        };
        extractionCache.set(snapshotUrl, { result, timestamp: Date.now() });
        return result;
      }
    } catch (e) {
      console.log(`[StealthExtractor] Extração rápida falhou, tentando Puppeteer...`);
    }

    // 3. Extração Profunda via Puppeteer (Fallback para Vídeos complexos e Carrosséis)
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      const mobileUA = this.userAgents[2];
      await page.setUserAgent(mobileUA);
      await page.setViewport({ width: 390, height: 844, isMobile: true });

      // Otimização: Bloquear recursos desnecessários
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (['font', 'stylesheet'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.goto(snapshotUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

      // Aguardar um tempo mínimo para scripts de vídeo
      await new Promise(resolve => setTimeout(resolve, 2500));

      const result = await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video && video.getAttribute('src')) {
          return {
            type: 'video',
            url: video.getAttribute('src'),
            thumbnail: video.getAttribute('poster') || undefined
          };
        }

        const images = Array.from(document.querySelectorAll('img')).filter(img => {
          const src = img.getAttribute('src') || '';
          return src.includes('fbcdn.net') && !src.includes('s60x60') && !src.includes('s32x32');
        });

        if (images.length > 1) {
          return {
            type: 'carousel',
            url: images.map(img => img.getAttribute('src') || '').filter(src => src !== '')
          };
        }

        if (images[0]) {
          return {
            type: 'image',
            url: images[0].getAttribute('src') || ''
          };
        }

        return null;
      });

      if (result) {
        extractionCache.set(snapshotUrl, { result: result as ExtractionResult, timestamp: Date.now() });
      }

      return result as ExtractionResult;

    } catch (error) {
      console.error('[StealthExtractor] Erro na extração profunda:', error);
      return null;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
