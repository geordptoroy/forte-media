import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Configurar o plugin stealth
puppeteer.use(StealthPlugin());

export interface ExtractionResult {
  type: 'video' | 'image' | 'carousel' | 'unknown';
  url: string | string[];
  thumbnail?: string;
}

export class StealthExtractorService {
  private static userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36'
  ];

  static async extractMedia(snapshotUrl: string): Promise<ExtractionResult | null> {
    console.log(`[StealthExtractor] Iniciando extração profunda para: ${snapshotUrl}`);
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // Usar UA mobile para snapshots costuma ser mais eficiente
      const mobileUA = this.userAgents[2];
      await page.setUserAgent(mobileUA);
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

      await page.goto(snapshotUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Aguardar renderização de mídias dinâmicas
      await new Promise(resolve => setTimeout(resolve, 5000));

      const result = await page.evaluate(() => {
        // 1. Tentar Vídeo
        const video = document.querySelector('video');
        if (video && video.getAttribute('src')) {
          return {
            type: 'video',
            url: video.getAttribute('src'),
            thumbnail: video.getAttribute('poster') || undefined
          };
        }

        // 2. Tentar Carrossel (Geralmente múltiplos itens com papel de 'img' ou em containers específicos)
        const carouselImages = Array.from(document.querySelectorAll('img')).filter(img => {
          const src = img.getAttribute('src') || '';
          return src.includes('fbcdn.net') && !src.includes('s60x60') && !src.includes('s32x32');
        });

        if (carouselImages.length > 1) {
          return {
            type: 'carousel',
            url: carouselImages.map(img => img.getAttribute('src') || '').filter(src => src !== '')
          };
        }

        // 3. Tentar Imagem Única
        const singleImage = carouselImages[0];
        if (singleImage) {
          return {
            type: 'image',
            url: singleImage.getAttribute('src') || ''
          };
        }

        return null;
      });

      // Fallback via Regex no HTML se o DOM falhar
      if (!result) {
        const html = await page.content();
        const videoMatch = html.match(/https:\/\/video[^"']+\.mp4[^"']*/);
        if (videoMatch) {
          return {
            type: 'video',
            url: videoMatch[0].replace(/\\/g, '')
          };
        }

        const imageMatch = html.match(/https:\/\/[^"']+\.fbcdn\.net\/v\/[^"']+\.(?:jpg|png|webp)[^"']*/);
        if (imageMatch) {
          return {
            type: 'image',
            url: imageMatch[0].replace(/\\/g, '')
          };
        }
      }

      return result as ExtractionResult;

    } catch (error) {
      console.error('[StealthExtractor] Erro na extração:', error);
      return null;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
