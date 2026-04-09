import { detectNiche, calculateScaleScore } from '../server/services/adIntelligenceService.optimized';

console.log('>>> Testando Algoritmo de Inteligência de Anúncios\n');

// ── Teste 1: Detecção de Nicho ─────────────────────────────────────────────
console.log('📌 Teste 1: Detecção de Nicho');
console.log('─'.repeat(50));

const testCases = [
  {
    name: 'Infoproduto',
    text: ['Aprenda a criar um curso online lucrativo! Mentoria exclusiva com certificado.'],
  },
  {
    name: 'Nutra',
    text: ['Emagreça 10kg em 30 dias com nossa fórmula natural de colágeno e vitaminas!'],
  },
  {
    name: 'SaaS',
    text: ['Plataforma de automação para gerenciar seu CRM e analytics em um único dashboard.'],
  },
  {
    name: 'E-commerce',
    text: ['Promoção especial! Compre agora com frete grátis e parcelamento em 12x sem juros.'],
  },
  {
    name: 'Imobiliário',
    text: ['Apartamento de 120m² no melhor bairro. Financiamento facilitado pela incorporadora.'],
  },
  {
    name: 'Fitness',
    text: ['Personal trainer online. Treino de musculação e hipertrofia com resultados garantidos!'],
  },
];

testCases.forEach(({ name, text }) => {
  const { niche, confidence } = detectNiche(text);
  const match = niche === name ? '✅' : '❌';
  console.log(`${match} ${name.padEnd(15)} → Detectado: ${niche.padEnd(15)} (Confiança: ${confidence.toFixed(1)}%)`);
});

// ── Teste 2: Cálculo de Score de Escala ────────────────────────────────────
console.log('\n📌 Teste 2: Cálculo de Score de Escala');
console.log('─'.repeat(50));

const scaleTestCases = [
  {
    name: 'Novo anúncio (Teste)',
    daysActive: 3,
    platforms: 1,
    creatives: 1,
    spend: 100,
    impressions: 5000,
  },
  {
    name: 'Anúncio em crescimento (Média)',
    daysActive: 20,
    platforms: 2,
    creatives: 3,
    spend: 500,
    impressions: 25000,
  },
  {
    name: 'Anúncio escalado (Alta)',
    daysActive: 60,
    platforms: 3,
    creatives: 8,
    spend: 2000,
    impressions: 100000,
  },
  {
    name: 'Anúncio massivo (Massiva)',
    daysActive: 150,
    platforms: 4,
    creatives: 15,
    spend: 10000,
    impressions: 500000,
  },
];

scaleTestCases.forEach(({ name, daysActive, platforms, creatives, spend, impressions }) => {
  const { score, label, estimatedROI } = calculateScaleScore(
    daysActive,
    platforms,
    creatives,
    spend,
    impressions
  );

  console.log(`\n${name}`);
  console.log(`  Dias ativos: ${daysActive}`);
  console.log(`  Plataformas: ${platforms}`);
  console.log(`  Criativos: ${creatives}`);
  console.log(`  Score: ${score.toFixed(1)}/100 → ${label}`);
  if (estimatedROI !== undefined) {
    console.log(`  ROI Estimado: ${estimatedROI > 0 ? '+' : ''}${estimatedROI.toFixed(1)}%`);
  }
});

// ── Teste 3: Análise de Confiança ──────────────────────────────────────────
console.log('\n📌 Teste 3: Análise de Confiança de Detecção');
console.log('─'.repeat(50));

const confidenceTests = [
  {
    name: 'Alta confiança',
    text: ['Curso online de marketing digital com certificação e mentoria exclusiva'],
  },
  {
    name: 'Média confiança',
    text: ['Aprenda novas habilidades online'],
  },
  {
    name: 'Baixa confiança',
    text: ['Confira nosso novo produto'],
  },
];

confidenceTests.forEach(({ name, text }) => {
  const { niche, confidence } = detectNiche(text);
  const level = confidence > 70 ? '🟢' : confidence > 40 ? '🟡' : '🔴';
  console.log(`${level} ${name.padEnd(20)} → ${niche.padEnd(15)} (${confidence.toFixed(1)}%)`);
});

console.log('\n✅ Testes concluídos!');
