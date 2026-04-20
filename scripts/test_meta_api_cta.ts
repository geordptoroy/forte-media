import axios from 'axios';

const ACCESS_TOKEN = 'EAAMuA4Ly8N0BRYWr7oTdsTEqZBOCekWuFJMJSlXpA47MaiZCKwWAYbRt1VxYu9ZC30JT0qrwc9vskrjuUkwClInSiwZCcRY8w6Wl2A4f5WsvVac1WXBEdUVgalj1AVdCcPWQ69gwC1gWfLU4SgVxLFLJNWdmzQlkKH84BuD2ReiHLA47eD1QSZCcxrrVnAZAcj6f7yg5RFbpcj7j3NEEwgZBY8zhCSLOiXb4EqicbR098DFpur5POpu2iLJ5NgW3hxV80FrVB3Q850t4V5U1l5NVAJ61GG8HmfXUgZDZD';

// Lista expandida de campos para tentar capturar informações de CTA e destino
const FIELDS = [
  'id',
  'ad_snapshot_url',
  'ad_creative_bodies',
  'ad_creative_link_captions',
  'ad_creative_link_descriptions',
  'ad_creative_link_titles',
  'page_id',
  'page_name',
  'ad_delivery_start_time',
  'ad_delivery_stop_time',
  'delivery_by_region',
  'impressions',
  'spend',
  'currency',
  'publisher_platforms',
  'languages',
  'target_locations',
  'target_ages',
  'target_gender'
];

async function testMetaAPI() {
  console.log('--- Iniciando Teste da API da Meta Ads Library ---');
  
  try {
    const response = await axios.get('https://graph.facebook.com/v22.0/ads_archive', {
      params: {
        access_token: ACCESS_TOKEN,
        search_terms: 'curso', // Termo genérico para encontrar anúncios com CTAs variados
        ad_reached_countries: "['BR']",
        ad_active_status: 'ACTIVE',
        fields: FIELDS.join(','),
        limit: 5
      }
    });

    const ads = response.data.data;
    console.log(`Encontrados ${ads.length} anúncios.`);

    ads.forEach((ad: any, index: number) => {
      console.log(`\n--- Anúncio #${index + 1} (ID: ${ad.id}) ---`);
      console.log('Página:', ad.page_name);
      console.log('Snapshot URL:', ad.ad_snapshot_url);
      console.log('Corpo:', ad.ad_creative_bodies?.[0]?.substring(0, 100) + '...');
      console.log('Link Caption:', ad.ad_creative_link_captions?.[0]);
      console.log('Link Title:', ad.ad_creative_link_titles?.[0]);
      console.log('Link Description:', ad.ad_creative_link_descriptions?.[0]);
      
      // Procurar por qualquer campo que não mapeamos mas que veio na resposta
      const extraFields = Object.keys(ad).filter(k => !FIELDS.includes(k));
      if (extraFields.length > 0) {
        console.log('Campos Extras Encontrados:', extraFields);
        extraFields.forEach(ef => console.log(`  ${ef}:`, JSON.stringify(ad[ef])));
      }
    });

    // Salvar o JSON completo do primeiro anúncio para inspeção profunda
    if (ads.length > 0) {
      const fs = require('fs');
      fs.writeFileSync('/home/ubuntu/forte-media/raw_ad_response.json', JSON.stringify(ads[0], null, 2));
      console.log('\nJSON completo do primeiro anúncio salvo em raw_ad_response.json');
    }

  } catch (error: any) {
    console.error('Erro na requisição:', error.response?.data || error.message);
  }
}

testMetaAPI();
