import requests
import re
import json

def analyze_snapshot_json(snapshot_url):
    print(f"--- Analisando JSON do Snapshot: {snapshot_url[:100]}... ---")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    try:
        response = requests.get(snapshot_url, headers=headers, timeout=10)
        html = response.text
        
        # 1. Buscar por blocos JSON no HTML (frequentemente contêm a URL de destino)
        # Procurar por chaves como "cta_url", "link_url", "destination_url"
        
        # Encontrar todas as strings que parecem URLs e não são da Meta
        all_urls = re.findall(r'https?://[^\s"\'<>\\}]+', html)
        external_urls = [u for u in all_urls if not any(d in u for d in ['facebook.com', 'fb.me', 'instagram.com', 'fbcdn.net', 'messenger.com'])]
        
        print(f"URLs Externas Brutas Encontradas: {list(set(external_urls))}")
        
        # 2. Procurar por campos específicos de CTA em strings JSON
        cta_patterns = [r'"cta_url":"([^"]+)"', r'"link_url":"([^"]+)"', r'"destination_url":"([^"]+)"', r'"call_to_action_url":"([^"]+)"']
        for pattern in cta_patterns:
            matches = re.findall(pattern, html)
            if matches:
                print(f"Match com padrão {pattern}: {matches}")

    except Exception as e:
        print(f"Erro: {e}")

if __name__ == '__main__':
    snapshot = "https://www.facebook.com/ads/archive/render_ad/?id=2013090986310104&access_token=EAAMuA4Ly8N0BRYWr7oTdsTEqZBOCekWuFJMJSlXpA47MaiZCKwWAYbRt1VxYu9ZC30JT0qrwc9vskrjuUkwClInSiwZCcRY8w6Wl2A4f5WsvVac1WXBEdUVgalj1AVdCcPWQ69gwC1gWfLU4SgVxLFLJNWdmzQlkKH84BuD2ReiHLA47eD1QSZCcxrrVnAZAcj6f7yg5RFbpcj7j3NEEwgZBY8zhCSLOiXb4EqicbR098DFpur5POpu2iLJ5NgW3hxV80FrVB3Q850t4V5U1l5NVAJ61GG8HmfXUgZDZD"
    analyze_snapshot_json(snapshot)
