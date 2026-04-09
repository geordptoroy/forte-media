import axios from 'axios';

const ACCESS_TOKEN = "EAAMuA4Ly8N0BRKjQn0fn20LWRT0KI1LelIL0nRbmWlAaTZBinZBqeZB6HT4KRt9iC5jR126arNzmRJBb8TXT3a8Y7E8C7FQXFVwOZAxowszZAYy13AI9VsaA4jZAJC4tFBz4aOhEv5PXNIawZAZCDlspMDMgmqw6NN83IeQUo4L6bWtXt43dbe9fsKyqWuvQF6ukfP6FrH4BecgVaZC8offXzJjpcGNxMKg3w9XJFZBGZB5mKqoi2sCZBkhdBrzf1sNt41daiJkbyWM48CotaYHW7ywCO2TrlxZCZByOytJQZDZD";

async function validateToken() {
  console.log(">>> Validando Meta Access Token...");
  
  try {
    // 1. Testar informações do token (debug_token)
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${ACCESS_TOKEN}&access_token=${ACCESS_TOKEN}`;
    const debugResponse = await axios.get(debugUrl);
    console.log("✅ Token Info:", JSON.stringify(debugResponse.data.data, null, 2));

    // 2. Testar busca básica na Ad Library (ads_archive)
    console.log("\n>>> Testando busca na Ad Library (Brasil, keywords: 'marketing')...");
    const searchUrl = `https://graph.facebook.com/v21.0/ads_archive`;
    const searchResponse = await axios.get(searchUrl, {
      params: {
        access_token: ACCESS_TOKEN,
        search_terms: 'marketing',
        ad_reached_countries: "['BR']",
        ad_active_status: 'ACTIVE',
        fields: 'id,ad_creative_bodies,ad_snapshot_url,page_name,ad_delivery_start_time,publisher_platforms,ad_creative_link_titles,ad_creative_link_descriptions',
        limit: 5
      }
    });

    console.log(`✅ Busca bem-sucedida! Encontrados ${searchResponse.data.data?.length || 0} anúncios.`);
    
    if (searchResponse.data.data?.length > 0) {
      const firstAd = searchResponse.data.data[0];
      console.log("\n>>> Exemplo de Anúncio Encontrado:");
      console.log(`ID: ${firstAd.id}`);
      console.log(`Página: ${firstAd.page_name}`);
      console.log(`Snapshot: ${firstAd.ad_snapshot_url}`);
    }

  } catch (error: any) {
    console.error("❌ Erro na validação:", error.response?.data || error.message);
  }
}

validateToken();
