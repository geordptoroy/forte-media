import fs from 'fs';
import path from 'path';

const htmlPath = '/home/ubuntu/upload/pasted_content_2.txt';

function extractUrls() {
  if (!fs.existsSync(htmlPath)) {
    console.error('Arquivo não encontrado:', htmlPath);
    return;
  }

  const html = fs.readFileSync(htmlPath, 'utf-8');
  
  console.log('>>> Analisando HTML para URLs de CDN (fbcdn.net)...\n');

  // 1. Encontrar vídeos
  const videoRegex = /<video[^>]+src=["']([^"']+)["']/gi;
  const videoMatches = [...html.matchAll(videoRegex)];
  console.log(`🎥 VÍDEOS ENCONTRADOS (${videoMatches.length}):`);
  videoMatches.forEach((m, i) => console.log(`  [${i}] ${m[1].substring(0, 100)}...`));

  // 2. Encontrar imagens de post (excluindo ícones pequenos)
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const imgMatches = [...html.matchAll(imgRegex)];
  console.log(`\n🖼️ IMAGENS ENCONTRADAS (${imgMatches.length}):`);
  imgMatches.forEach((m, i) => {
    const url = m[1];
    if (url.includes('scontent') && !url.includes('s60x60')) {
      console.log(`  [${i}] (Provável Post) ${url.substring(0, 100)}...`);
    } else {
      console.log(`  [${i}] (Provável Ícone) ${url.substring(0, 60)}...`);
    }
  });

  // 3. Encontrar posters de vídeo
  const posterRegex = /poster=["']([^"']+)["']/gi;
  const posterMatches = [...html.matchAll(posterRegex)];
  console.log(`\n🎨 POSTERS ENCONTRADOS (${posterMatches.length}):`);
  posterMatches.forEach((m, i) => console.log(`  [${i}] ${m[1].substring(0, 100)}...`));
}

extractUrls();
