import axios from 'axios';

const ACCESS_TOKEN = "EAAMuA4Ly8N0BRKjQn0fn20LWRT0KI1LelIL0nRbmWlAaTZBinZBqeZB6HT4KRt9iC5jR126arNzmRJBb8TXT3a8Y7E8C7FQXFVwOZAxowszZAYy13AI9VsaA4jZAJC4tFBz4aOhEv5PXNIawZAZCDlspMDMgmqw6NN83IeQUo4L6bWtXt43dbe9fsKyqWuvQF6ukfP6FrH4BecgVaZC8offXzJjpcGNxMKg3w9XJFZBGZB5mKqoi2sCZBkhdBrzf1sNt41daiJkbyWM48CotaYHW7ywCO2TrlxZCZByOytJQZDZD";

async function testMediaExtraction() {
  console.log(">>> Testando extração de mídia de anúncios reais...\n");

  try {
    // Buscar anúncios com campos de mídia
    const searchUrl = `https://graph.facebook.com/v21.0/ads_archive`;
    const response = await axios.get(searchUrl, {
      params: {
        access_token: ACCESS_TOKEN,
        search_terms: 'marketing',
        ad_reached_countries: "['BR']",
        ad_active_status: 'ACTIVE',
        fields: 'id,ad_creative_bodies,ad_snapshot_url,page_name,ad_delivery_start_time,ad_delivery_stop_time,publisher_platforms,ad_creative_link_titles,ad_creative_link_descriptions,ad_creative_images,ad_creative_videos,currency,spend,impressions',
        limit: 10
      }
    });

    const ads = response.data.data || [];
    console.log(`✅ Encontrados ${ads.length} anúncios\n`);

    // Analisar campos de mídia
    let mediaStats = {
      totalAds: ads.length,
      withImages: 0,
      withVideos: 0,
      withSnapshotUrl: 0,
      withCreativeBodies: 0,
      mediaTypes: {} as Record<string, number>,
    };

    ads.forEach((ad: any, idx: number) => {
      console.log(`\n📌 Anúncio ${idx + 1}:`);
      console.log(`   ID: ${ad.id}`);
      console.log(`   Página: ${ad.page_name}`);

      // Verificar campos de mídia
      if (ad.ad_creative_images?.length) {
          console.log(`   ✓ Imagens: ${ad.ad_creative_images?.length || 0}`);
        ad.ad_creative_images.forEach((img: any, i: number) => {
          console.log(`     [${i}] ${img.url?.substring(0, 80)}...`);
        });
        mediaStats.withImages++;
        mediaStats.mediaTypes['images'] = (mediaStats.mediaTypes['images'] || 0) + 1;
      }

      if (ad.ad_creative_videos?.length) {
          console.log(`   ✓ Vídeos: ${ad.ad_creative_videos?.length || 0}`);
        ad.ad_creative_videos.forEach((vid: any, i: number) => {
          console.log(`     [${i}] Thumbnail: ${vid.thumbnail_url?.substring(0, 80)}...`);
        });
        mediaStats.withVideos++;
        mediaStats.mediaTypes['videos'] = (mediaStats.mediaTypes['videos'] || 0) + 1;
      }

      if (ad.ad_snapshot_url) {
        console.log(`   ✓ Snapshot URL: ${ad.ad_snapshot_url.substring(0, 80)}...`);
        mediaStats.withSnapshotUrl++;
      }

      if (ad.ad_creative_bodies?.length) {
        console.log(`   ✓ Corpos de Criativo: ${ad.ad_creative_bodies.length}`);
        mediaStats.withCreativeBodies++;
      }

      // Dados de performance
      if (ad.spend || ad.impressions) {
        console.log(`   📊 Performance:`);
        if (ad.spend) console.log(`      Gasto: ${ad.currency} ${ad.spend}`);
        if (ad.impressions) console.log(`      Impressões: ${ad.impressions}`);
      }
    });

    // Resumo
    console.log("\n\n📊 RESUMO DE MÍDIA:");
    console.log(`Total de anúncios: ${mediaStats.totalAds}`);
    console.log(`Com imagens: ${mediaStats.withImages} (${((mediaStats.withImages / mediaStats.totalAds) * 100).toFixed(1)}%)`);
    console.log(`Com vídeos: ${mediaStats.withVideos} (${((mediaStats.withVideos / mediaStats.totalAds) * 100).toFixed(1)}%)`);
    console.log(`Com snapshot URL: ${mediaStats.withSnapshotUrl} (${((mediaStats.withSnapshotUrl / mediaStats.totalAds) * 100).toFixed(1)}%)`);
    console.log(`Com corpos de criativo: ${mediaStats.withCreativeBodies} (${((mediaStats.withCreativeBodies / mediaStats.totalAds) * 100).toFixed(1)}%)`);

  } catch (error: any) {
    console.error("❌ Erro:", error.response?.data || error.message);
  }
}

testMediaExtraction();
