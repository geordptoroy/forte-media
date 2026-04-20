import requests
import json

ACCESS_TOKEN = 'EAAMuA4Ly8N0BRYWr7oTdsTEqZBOCekWuFJMJSlXpA47MaiZCKwWAYbRt1VxYu9ZC30JT0qrwc9vskrjuUkwClInSiwZCcRY8w6Wl2A4f5WsvVac1WXBEdUVgalj1AVdCcPWQ69gwC1gWfLU4SgVxLFLJNWdmzQlkKH84BuD2ReiHLA47eD1QSZCcxrrVnAZAcj6f7yg5RFbpcj7j3NEEwgZBY8zhCSLOiXb4EqicbR098DFpur5POpu2iLJ5NgW3hxV80FrVB3Q850t4V5U1l5NVAJ61GG8HmfXUgZDZD'

# Campos que podem conter o destino real
FIELDS = [
    'id',
    'ad_snapshot_url',
    'ad_creative_bodies',
    'ad_creative_link_captions',
    'ad_creative_link_descriptions',
    'ad_creative_link_titles',
    'page_id',
    'page_name'
]

def test_meta_api():
    print('--- Teste de API Meta: Foco em Links de Destino ---')
    
    url = 'https://graph.facebook.com/v22.0/ads_archive'
    params = {
        'access_token': ACCESS_TOKEN,
        'search_terms': 'whatsapp', # Buscar anúncios que provavelmente usam WhatsApp como CTA
        'ad_reached_countries': "['BR']",
        'ad_active_status': 'ACTIVE',
        'fields': ','.join(FIELDS),
        'limit': 10
    }

    try:
        response = requests.get(url, params=params)
        data = response.json()
        ads = data.get('data', [])

        for i, ad in enumerate(ads):
            print(f"\n[Anúncio {i+1}] ID: {ad.get('id')}")
            
            # 1. Verificar Captions (Onde geralmente aparece o domínio)
            captions = ad.get('ad_creative_link_captions', [])
            print(f"  Captions: {captions}")
            
            # 2. Verificar o corpo em busca de links diretos (api.whatsapp.com, wa.me, bit.ly, etc)
            bodies = ad.get('ad_creative_bodies', [])
            if bodies:
                body = bodies[0]
                import re
                urls = re.findall(r'(https?://[^\s]+)', body)
                if urls:
                    print(f"  Links no Corpo: {urls}")
            
            # 3. Analisar o Link Title (Às vezes contém o CTA)
            titles = ad.get('ad_creative_link_titles', [])
            print(f"  Título do Link: {titles}")

    except Exception as e:
        print(f"Erro: {e}")

if __name__ == '__main__':
    test_meta_api()
