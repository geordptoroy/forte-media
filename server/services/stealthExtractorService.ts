import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { type ExtractionResult } from "../types/adTypes";

// Configurar o plugin stealth
puppeteer.use(StealthPlugin());

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
    
    // 2. Extração via Puppeteer
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

      // Otimização: Bloquear recursos pesados mas manter scripts para renderização do anúncio
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (['font'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.goto(snapshotUrl, { waitUntil: 'networkidle2', timeout: 20000 });

      // Aguardar um tempo para scripts de renderização do anúncio e botões
      await new Promise(resolve => setTimeout(resolve, 3000));

      const result = await page.evaluate(() => {
        // --- EXTRAÇÃO DE MÍDIA ---
        let mediaType: 'video' | 'image' | 'carousel' | 'unknown' = 'unknown';
        let mediaUrl: string | string[] = '';
        let thumbnail: string | undefined = undefined;

        const video = document.querySelector('video');
        if (video && video.getAttribute('src')) {
          mediaType = 'video';
          mediaUrl = video.getAttribute('src') || '';
          thumbnail = video.getAttribute('poster') || undefined;
        } else {
          const images = Array.from(document.querySelectorAll('img')).filter(img => {
            const src = img.getAttribute('src') || '';
            return src.includes('fbcdn.net') && !src.includes('s60x60') && !src.includes('s32x32');
          });

          if (images.length > 1) {
            mediaType = 'carousel';
            mediaUrl = images.map(img => img.getAttribute('src') || '').filter(src => src !== '');
          } else if (images[0]) {
            mediaType = 'image';
            mediaUrl = images[0].getAttribute('src') || '';
          }
        }

        // --- EXTRAÇÃO DE TÍTULO E CTA ---
        const titleElement = document.querySelector('div[role="button"] div > span, h1, h2, h3');
        const title = titleElement?.textContent?.trim() || "";

        const allLinks = Array.from(document.querySelectorAll('a'));
        const fbRedirect = allLinks.find(a => a.getAttribute('href')?.includes('l.php?u='));
        
        let ctaLink = "";
        if (fbRedirect) {
          const href = fbRedirect.getAttribute('href') || '';
          try {
            const urlObj = new URL(href.startsWith('http') ? href : `https://www.facebook.com${href}`);
            ctaLink = urlObj.searchParams.get('u') || "";
          } catch (e) {}
        }

        return {
          type: mediaType,
          url: mediaUrl,
          thumbnail,
          title,
          ctaLink
        };
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
