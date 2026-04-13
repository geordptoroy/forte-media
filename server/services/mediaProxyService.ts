import axios from 'axios';
import { logger } from '../_core/logger';

/**
 * Media Proxy Service — Mascaramento de Fingerprint para burlar bloqueios da Meta
 */

// Fingerprint de Navegador Real (Windows 10 / Chrome 144)
const REAL_BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-CH-UA': '"Not(A:Brand";v="99", "Google Chrome";v="144", "Chromium";v="144"',
  'Sec-CH-UA-Mobile': '?0',
  'Sec-CH-UA-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'image',
  'Sec-Fetch-Mode': 'no-cors',
  'Sec-Fetch-Site': 'cross-site',
  'Referer': 'https://www.facebook.com/',
};

/**
 * Realiza o proxy de uma URL de mídia da Meta com mascaramento
 */
export async function proxyMedia(url: string, res: any) {
  if (!url || !url.startsWith('http')) {
    return res.status(400).send('URL inválida');
  }

  try {
    logger.info(`[MediaProxy] Solicitando mídia com máscara: ${url.substring(0, 50)}...`);

    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      headers: REAL_BROWSER_HEADERS,
      timeout: 15000, // 15 segundos de timeout
    });

    // Repassar os headers de conteúdo (tipo e tamanho)
    const contentType = response.headers['content-type'];
    const contentLength = response.headers['content-length'];

    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    
    // Cache de 1 dia no navegador do usuário para performance
    res.setHeader('Cache-Control', 'public, max-age=86400');

    // Pipe do stream da Meta para a resposta do nosso servidor
    response.data.pipe(res);

  } catch (error: any) {
    logger.error(`[MediaProxy] Falha ao carregar mídia: ${error.message}`, { url });
    
    if (error.response) {
      res.status(error.response.status).send('Erro ao carregar mídia da Meta');
    } else {
      res.status(500).send('Erro interno no proxy de mídia');
    }
  }
}
