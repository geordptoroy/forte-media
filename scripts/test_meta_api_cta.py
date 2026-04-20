import requests
import json

ACCESS_TOKEN = 'EAAMuA4Ly8N0BRYWr7oTdsTEqZBOCekWuFJMJSlXpA47MaiZCKwWAYbRt1VxYu9ZC30JT0qrwc9vskrjuUkwClInSiwZCcRY8w6Wl2A4f5WsvVac1WXBEdUVgalj1AVdCcPWQ69gwC1gWfLU4SgVxLFLJNWdmzQlkKH84BuD2ReiHLA47eD1QSZCcxrrVnAZAcj6f7yg5RFbpcj7j3NEEwgZBY8zhCSLOiXb4EqicbR098DFpur5POpu2iLJ5NgW3hxV80FrVB3Q850t4V5U1l5NVAJ61GG8HmfXUgZDZD'

FIELDS = [
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
    'publisher_platforms'
]

def test_meta_api():
    print('--- Iniciando Teste da API da Meta Ads Library (Python) ---')
    
    url = 'https://graph.facebook.com/v22.0/ads_archive'
    params = {
        'access_token': ACCESS_TOKEN,
        'search_terms': 'curso',
        'ad_reached_countries': "['BR']",
        'ad_active_status': 'ACTIVE',
        'fields': ','.join(FIELDS),
        'limit': 5
    }

    try:
        response = requests.get(url, params=params)
        data = response.json()

        if 'error' in data:
            print(f"Erro na API: {json.dumps(data['error'], indent=2)}")
            return

        ads = data.get('data', [])
        print(f"Encontrados {len(ads)} anúncios.")

        for i, ad in enumerate(ads):
            print(f"\n--- Anúncio #{i + 1} (ID: {ad.get('id')}) ---")
            print(f"Página: {ad.get('page_name')}")
            print(f"Snapshot URL: {ad.get('ad_snapshot_url')}")
            
            bodies = ad.get('ad_creative_bodies', [])
            if bodies:
                print(f"Corpo: {bodies[0][:100]}...")
            
            captions = ad.get('ad_creative_link_captions', [])
            if captions:
                print(f"Link Caption: {captions[0]}")
                
            titles = ad.get('ad_creative_link_titles', [])
            if titles:
                print(f"Link Title: {titles[0]}")

            # Verificar se existem outros campos retornados que não solicitamos explicitamente
            # (Às vezes a API retorna campos extras ou aninhados)
            all_keys = ad.keys()
            extra_keys = [k for k in all_keys if k not in FIELDS]
            if extra_keys:
                print(f"Campos Extras: {extra_keys}")
                for ek in extra_keys:
                    print(f"  {ek}: {ad[ek]}")

        if ads:
            with open('/home/ubuntu/forte-media/raw_ad_response.json', 'w') as f:
                json.dump(ads[0], f, indent=2)
            print('\nJSON completo do primeiro anúncio salvo em raw_ad_response.json')

    except Exception as e:
        print(f"Erro na execução: {str(e)}")

if __name__ == '__main__':
    test_meta_api()
