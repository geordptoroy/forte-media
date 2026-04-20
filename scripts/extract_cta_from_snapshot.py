import requests
import re
import json

def extract_cta_from_snapshot(snapshot_url):
    print(f"--- Analisando Snapshot: {snapshot_url[:100]}... ---")
    try:
        # Usar um User-Agent de navegador real
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        response = requests.get(snapshot_url, headers=headers, timeout=10)
        html = response.text
        
        # 1. Tentar encontrar URLs de redirecionamento (comuns em CTAs da Meta)
        # Frequentemente os links estão em campos como "cta_url", "target_url" ou em blocos JSON
        
        # Buscar por links que não sejam do Facebook/Instagram
        # Padrao: URLs que aparecem em atributos href ou em strings JSON
        urls = re.findall(r'https?://(?:www\.)?([^/]+\.[^/]+)/', html)
        
        # Filtrar domínios conhecidos da Meta
        excluded_domains = ['facebook.com', 'fb.me', 'instagram.com', 'fbcdn.net', 'messenger.com', 'whatsapp.com']
        external_urls = [u for u in urls if not any(d in u for d in excluded_domains)]
        
        print(f"Domínios Externos Encontrados no HTML: {list(set(external_urls))}")
        
        # 2. Buscar especificamente por links de WhatsApp se for o caso
        wa_links = re.findall(r'https?://(?:api\.whatsapp\.com|wa\.me)/[^\s"\'<>]+', html)
        if wa_links:
            print(f"Links de WhatsApp Encontrados: {list(set(wa_links))}")

        return list(set(external_urls))

    except Exception as e:
        print(f"Erro ao extrair do snapshot: {e}")
        return []

# Testar com o primeiro anúncio do teste anterior
if __name__ == '__main__':
    # Usar o snapshot do anúncio #2 do primeiro teste (roadmap50usddiarios.systeme.io)
    snapshot = "https://www.facebook.com/ads/archive/render_ad/?id=2013090986310104&access_token=EAAMuA4Ly8N0BRYWr7oTdsTEqZBOCekWuFJMJSlXpA47MaiZCKwWAYbRt1VxYu9ZC30JT0qrwc9vskrjuUkwClInSiwZCcRY8w6Wl2A4f5WsvVac1WXBEdUVgalj1AVdCcPWQ69gwC1gWfLU4SgVxLFLJNWdmzQlkKH84BuD2ReiHLA47eD1QSZCcxrrVnAZAcj6f7yg5RFbpcj7j3NEEwgZBY8zhCSLOiXb4EqicbR098DFpur5POpu2iLJ5NgW3hxV80FrVB3Q850t4V5U1l5NVAJ61GG8HmfXUgZDZD"
    extract_cta_from_snapshot(snapshot)
