import axios from 'axios';

const TEST_TOKEN = "EAAMuA4Ly8N0BRC8aBQAbd8HSzkqt4sWx6qkrvZAKS2aILENfNWOe6dFkM2EBa9PWwDUFK1rFzyRUfjUY1K36zNefzQ527Dl4ZCsBrjG6iVxbof375BVSVXnlcN7aN6VRtWHXeR2xvTtxAdY3yPP2qhanoRbR2oLBD8dU7MKpB4a7z6e0Fa3DqXGDMlsOZAghMz1RPvBkEsSxW792lWWgEb3T4P1vi3akeUSiyMzZB4VZCyiz7THHdRBjumuk6xc44zpxAiUugHxqHdaVohXyBtYip93Q7wkQkSAZDZD";
const META_GRAPH_URL = 'https://graph.facebook.com/v21.0/ads_archive';

const NICHES = [
  "Relacionamento", "Espiritualidade", "Renda Extra", "Emagrecimento",
  "Marketing Digital", "Desenvolvimento Pessoal", "Finanças", "Saúde",
  "Beleza", "Culinária", "Maternidade", "Idiomas", "Concursos Públicos",
  "Música", "Artesanato", "Pet", "Programação", "Empreendedorismo"
];

const PRODUCT_TYPES = ["Infoproduto", "Nutra", "Encapsulado"];

async function testSearch(term: string, country: string = "BR") {
  try {
    const response = await axios.get(META_GRAPH_URL, {
      params: {
        access_token: TEST_TOKEN,
        search_terms: term,
        ad_reached_countries: JSON.stringify([country]),
        ad_active_status: 'ACTIVE',
        limit: 1,
        fields: 'id,page_name,ad_snapshot_url,ad_creative_bodies,spend,impressions,publisher_platforms'
      }
    });

    const ads = response.data?.data || [];
    if (ads.length > 0) {
      const ad = ads[0];
      return {
        Termo: term,
        Status: "✅ OK",
        Anúncios: ads.length,
        Exemplo: ad.page_name,
        Plataformas: ad.publisher_platforms?.join(", ") || "N/A"
      };
    }
    return { Termo: term, Status: "⚠️ Vazio", Anúncios: 0, Exemplo: "-", Plataformas: "-" };
  } catch (error: any) {
    return { Termo: term, Status: "❌ Erro", Anúncios: 0, Exemplo: error.response?.data?.error?.message || error.message, Plataformas: "-" };
  }
}

async function run() {
  console.log("🚀 Iniciando Bateria Completa de Testes (Nichos e Produtos)...");
  const results = [];

  for (const niche of NICHES) {
    results.push(await testSearch(niche));
  }
  for (const type of PRODUCT_TYPES) {
    results.push(await testSearch(type));
  }

  console.table(results);
}

run().catch(console.error);
