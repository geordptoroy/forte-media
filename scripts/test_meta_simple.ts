import axios from 'axios';

const TEST_TOKEN = "EAAMuA4Ly8N0BRC8aBQAbd8HSzkqt4sWx6qkrvZAKS2aILENfNWOe6dFkM2EBa9PWwDUFK1rFzyRUfjUY1K36zNefzQ527Dl4ZCsBrjG6iVxbof375BVSVXnlcN7aN6VRtWHXeR2xvTtxAdY3yPP2qhanoRbR2oLBD8dU7MKpB4a7z6e0Fa3DqXGDMlsOZAghMz1RPvBkEsSxW792lWWgEb3T4P1vi3akeUSiyMzZB4VZCyiz7THHdRBjumuk6xc44zpxAiUugHxqHdaVohXyBtYip93Q7wkQkSAZDZD";
const META_GRAPH_URL = 'https://graph.facebook.com/v21.0/ads_archive';

const NICHES = [
  "Relacionamento",
  "Espiritualidade",
  "Renda Extra",
  "Emagrecimento",
  "Marketing Digital"
];

const PRODUCT_TYPES = [
  "Infoproduto",
  "Nutra",
  "Encapsulado"
];

async function testSearch(term: string, country: string = "BR") {
  console.log(`\n🔍 Buscando: "${term}" | País: ${country}`);
  try {
    const response = await axios.get(META_GRAPH_URL, {
      params: {
        access_token: TEST_TOKEN,
        search_terms: term,
        ad_reached_countries: JSON.stringify([country]),
        ad_active_status: 'ACTIVE',
        limit: 3,
        fields: 'id,page_name,ad_snapshot_url,ad_creative_bodies,spend,impressions'
      }
    });

    const ads = response.data?.data || [];
    console.log(`✅ Encontrados ${ads.length} anúncios.`);
    ads.forEach((ad: any, i: number) => {
      console.log(`   [${i+1}] ${ad.page_name} | ID: ${ad.id}`);
      if (ad.spend) console.log(`       Gasto: ${JSON.stringify(ad.spend)}`);
    });
  } catch (error: any) {
    console.error(`❌ Erro: ${error.response?.data?.error?.message || error.message}`);
  }
}

async function run() {
  console.log("🚀 Iniciando Teste Simplificado da Meta API...");
  for (const niche of NICHES) {
    await testSearch(niche);
  }
  for (const type of PRODUCT_TYPES) {
    await testSearch(type);
  }
}

run().catch(console.error);
