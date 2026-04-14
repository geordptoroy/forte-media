import axios from 'axios';
import fs from 'fs';

const ACCESS_TOKEN = 'EAAMuA4Ly8N0BRF0bnGutJMjvKNmcybx3Cr7ZBhHEnUMEFdfJFkGtt4ctQAoqvV8YTVe74TrNSPtMF0KXZCOctSfhQgHKW8YM7O0ZCZBI1aCBXr2s8uFpUZClv2cAIGXx0MPwPntZA3pfJ54ZBACDnaDVevkZBhQayVlZBulZB4X0cI6AeqdjPDA17G3bZACFptY2HQUVb8R6BZCdNGi15I9kraZBeq0LjX0SEvms6vZAWjq4aEIrThc3DyZBsmV8gyh0q3DNKAvqYPzUTPvkANf7NnG15q0GDZATIW9d4rOllhAZD';

const ALL_FIELDS = [
  'id',
  'ad_creation_time',
  'ad_creative_bodies',
  'ad_creative_link_captions',
  'ad_creative_link_descriptions',
  'ad_creative_link_titles',
  'ad_delivery_start_time',
  'ad_delivery_stop_time',
  'ad_snapshot_url',
  'currency',
  'delivery_by_region',
  'demographic_distribution',
  'estimated_audience_size',
  'impressions',
  'languages',
  'page_id',
  'page_name',
  'publisher_platforms',
  'spend',
  'target_ages',
  'target_gender',
  'target_locations',
  'age_country_gender_reach_breakdown',
  'bylines'
];

async function testMetaAPI(niche: string, country: string = 'BR') {
  console.log(`\n--- Testando Nicho: ${niche} (${country}) ---`);
  
  const url = `https://graph.facebook.com/v22.0/ads_archive`;
  
  try {
    const response = await axios.get(url, {
      params: {
        access_token: ACCESS_TOKEN,
        search_terms: niche,
        ad_type: 'POLITICAL_AND_ISSUE_ADS', // Usando este para garantir retorno de dados de spend/impressions se disponíveis
        ad_reached_countries: `['${country}']`,
        fields: ALL_FIELDS.join(','),
        limit: 1
      }
    });

    if (response.data.data && response.data.data.length > 0) {
      const ad = response.data.data[0];
      console.log(`✅ Sucesso! Encontrado anúncio de: ${ad.page_name}`);
      return ad;
    } else {
      // Tentar busca geral se não houver resultados em anúncios políticos
      const generalResponse = await axios.get(url, {
        params: {
          access_token: ACCESS_TOKEN,
          search_terms: niche,
          ad_type: 'ALL',
          ad_reached_countries: `['${country}']`,
          fields: ALL_FIELDS.join(','),
          limit: 1
        }
      });
      
      if (generalResponse.data.data && generalResponse.data.data.length > 0) {
        const ad = generalResponse.data.data[0];
        console.log(`✅ Sucesso (Busca Geral)! Encontrado anúncio de: ${ad.page_name}`);
        return ad;
      }
      
      console.log(`⚠️ Nenhum anúncio encontrado para o nicho: ${niche}`);
      return null;
    }
  } catch (error: any) {
    console.error(`❌ Erro na API (${niche}):`, error.response?.data || error.message);
    return null;
  }
}

async function runBattery() {
  const niches = [
    'Emagrecimento',
    'Renda Extra',
    'Relacionamento',
    'Marketing Digital',
    'Investimentos'
  ];
  
  const results: any[] = [];
  
  for (const niche of niches) {
    const ad = await testMetaAPI(niche);
    if (ad) results.push({ niche, data: ad });
  }
  
  if (results.length > 0) {
    fs.writeFileSync('/home/ubuntu/meta_raw_results.json', JSON.stringify(results, null, 2));
    console.log('\n--- Bateria concluída! Resultados salvos em /home/ubuntu/meta_raw_results.json ---');
    
    // Mapear todos os campos únicos encontrados
    const allKeys = new Set<string>();
    results.forEach(r => {
      Object.keys(r.data).forEach(key => allKeys.add(key));
    });
    
    console.log('\n--- Campos Identificados ---');
    console.log(Array.from(allKeys).join(', '));
  }
}

runBattery();
