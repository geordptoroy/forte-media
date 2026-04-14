import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Configurar o plugin stealth
puppeteer.use(StealthPlugin());

export class StealthExtractorService {
  private static userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36'
  ];

  static async extractVideoUrl(snapshotUrl: string): Promise<string | null> {
    console.log(`[StealthExtractor] Iniciando extração para: ${snapshotUrl}`);
    
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
      
      // Configurar Fingerprint
      const randomUA = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
      await page.setUserAgent(randomUA);
      await page.setViewport({ width: 1280, height: 800 });

      // Navegar para a URL do snapshot
      await page.goto(snapshotUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Tentar encontrar o vídeo
      // A Meta costuma usar tags <video> ou blobs. Vamos tentar pegar o src da tag video.
      const videoSrc = await page.evaluate(() => {
        const videoElement = document.querySelector('video');
        return videoElement ? videoElement.getAttribute('src') : null;
      });

      if (videoSrc) {
        console.log(`[StealthExtractor] Vídeo encontrado: ${videoSrc.substring(0, 50)}...`);
        return videoSrc;
      }

      // Se não encontrar direto, pode estar dentro de um iframe ou carregar via JS posterior
      // Vamos esperar um pouco mais ou tentar outro seletor
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const retryVideoSrc = await page.evaluate(() => {
        const videoElement = document.querySelector('video');
        return videoElement ? videoElement.getAttribute('src') : null;
      });

      return retryVideoSrc;

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
