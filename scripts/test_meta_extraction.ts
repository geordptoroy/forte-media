import * as metaAdsService from "../server/services/metaAdsService.ts";
import { logger } from "../server/_core/logger.ts";

const TEST_TOKEN = "EAAMuA4Ly8N0BRC8aBQAbd8HSzkqt4sWx6qkrvZAKS2aILENfNWOe6dFkM2EBa9PWwDUFK1rFzyRUfjUY1K36zNefzQ527Dl4ZCsBrjG6iVxbof375BVSVXnlcN7aN6VRtWHXeR2xvTtxAdY3yPP2qhanoRbR2oLBD8dU7MKpB4a7z6e0Fa3DqXGDMlsOZAghMz1RPvBkEsSxW792lWWgEb3T4P1vi3akeUSiyMzZB4VZCyiz7THHdRBjumuk6xc44zpxAiUugHxqHdaVohXyBtYip93Q7wkQkSAZDZD";

const NICHES = [
  "Relacionamento",
  "Espiritualidade",
  "Renda Extra",
  "Emagrecimento",
  "Marketing Digital",
  "Desenvolvimento Pessoal",
  "Finanças",
  "Saúde",
  "Beleza",
  "Culinária",
  "Maternidade",
  "Idiomas",
  "Concursos Públicos",
  "Música",
  "Artesanato",
  "Pet",
  "Programação",
  "Empreendedorismo"
];

const PRODUCT_TYPES = [
  "Infoproduto",
  "Nutra",
  "Encapsulado"
];

const COUNTRIES = ["BR", "US", "PT"];

async function runTests() {
  console.log("🚀 Iniciando Bateria de Testes de Extração Meta Ads...");
  
  const results: any[] = [];

  for (const niche of NICHES.slice(0, 5)) { // Testar os 5 primeiros para brevidade
    for (const country of [COUNTRIES[0]]) { // Focar no Brasil primeiro
      console.log(`\n🔍 Testando Nicho: ${niche} | País: ${country}`);
      
      try {
        const result = await metaAdsService.fetchAdsArchive({
          accessToken: TEST_TOKEN,
          searchTerms: niche,
          adReachedCountries: [country],
          limit: 5,
          adActiveStatus: 'ACTIVE'
        });

        const count = result.data?.length || 0;
        console.log(`✅ Encontrados ${count} anúncios.`);
        
        if (count > 0) {
          const sampleAd = result.data[0];
          console.log(`   - Exemplo: ${sampleAd.page_name} (ID: ${sampleAd.id})`);
          console.log(`   - Campos capturados: ${Object.keys(sampleAd).length}`);
          
          results.push({
            niche,
            country,
            count,
            fields: Object.keys(sampleAd)
          });
        }
      } catch (error: any) {
        console.error(`❌ Erro no nicho ${niche}: ${error.message}`);
      }
    }
  }

  for (const type of PRODUCT_TYPES) {
    console.log(`\n🔍 Testando Tipo de Produto: ${type}`);
    try {
      const result = await metaAdsService.fetchAdsArchive({
        accessToken: TEST_TOKEN,
        searchTerms: type,
        adReachedCountries: ["BR"],
        limit: 5,
        adActiveStatus: 'ACTIVE'
      });
      console.log(`✅ Encontrados ${result.data?.length || 0} anúncios para ${type}.`);
    } catch (error: any) {
      console.error(`❌ Erro no tipo ${type}: ${error.message}`);
    }
  }

  console.log("\n📊 Resumo dos Testes:");
  console.table(results);
}

runTests().catch(console.error);
