# Análise Técnica: Como o Sistema Identifica o Link do CTA e Destino do Lead

Com base na análise do código do repositório `forte-media` e nos testes realizados com o token da API da Meta fornecido, identificamos o mecanismo exato de como o sistema descobre para onde o anunciante deseja enviar o lead (Call to Action - CTA).

## 1. O Campo de Dados Principal: `ad_creative_link_captions`

Diferente do que se imagina, a API da Meta Ads Library **não entrega um campo direto chamado "cta_url"** de forma simples e aberta. O dado mais importante que o sistema recebe é o campo:

*   **`ad_creative_link_captions`**: Este campo contém o **domínio ou link curto** que aparece logo abaixo do título do anúncio, junto ao botão de ação.
    *   *Exemplo Real:* No teste realizado, o anúncio de ID `2013090986310104` retornou `roadmap50usddiarios.systeme.io` neste campo.

## 2. A Lógica de Extração de Links no Servidor

O sistema `forte-media` implementa uma lógica de "limpeza" e "priorização" para definir a `destination_url` (URL de destino). Veja como o código em `server/services/metaAdsService.ts` processa isso:

### A Hierarquia de Descoberta:
1.  **Busca em Captions:** O sistema varre o array `ad_creative_link_captions`. Se encontrar algo que se pareça com uma URL, define como o destino.
2.  **Mineração de Texto (Regex):** Se o caption estiver vazio ou não for uma URL, o sistema varre o corpo do anúncio (`ad_creative_bodies`), o título (`ad_creative_link_titles`) e a descrição (`ad_creative_link_descriptions`) em busca de links.
3.  **Filtro de Exclusão:** Para evitar capturar links "falsos", o sistema ignora qualquer URL que contenha domínios da própria Meta, como:
    *   `facebook.com`
    *   `fb.me`
    *   `instagram.com`

> **Nota Técnica:** O sistema prioriza o link que **não é da Meta**, pois este é o destino real (site externo, checkout, WhatsApp) para onde o anunciante quer levar o lead.

## 3. Identificação de Destinos Específicos (WhatsApp, Site, etc.)

O sistema diferencia o tipo de destino através da análise do padrão da URL extraída:

| Tipo de Destino | Padrão de URL Detectado | Localização no Dado |
| :--- | :--- | :--- |
| **Site / Landing Page** | `https://meusite.com`, `bit.ly/...` | `ad_creative_link_captions` ou corpo |
| **WhatsApp (X1)** | `wa.me/...`, `api.whatsapp.com/...` | Geralmente no corpo do texto ou link curto |
| **Checkout Direto** | `pay.hotmart.com`, `checkout.kiwify...` | Extraído via regex do corpo/descrição |

## 4. O Papel do "Snapshot URL"

A `ad_snapshot_url` que você vê na API é apenas uma **página de visualização** gerada pela Meta. O sistema `forte-media` usa essa URL apenas como último recurso (`fallback`). 

Para obter o link final que o botão do anúncio (CTA) abre, o sistema utiliza o `StealthExtractorService`. Este serviço simula um navegador real, acessa o snapshot e tenta "ler" o que está configurado no botão, extraindo o link externo que a Meta "esconde" dentro de seus scripts internos.

## Resumo do Fluxo de Dados

1.  **API Meta:** Envia o texto do anúncio e o domínio do link (`ad_creative_link_captions`).
2.  **Servidor (Forte Media):** Extrai o domínio e busca links externos no texto usando Regex.
3.  **Classificação:** Se o link for `wa.me`, marca como "Funil X1". Se for um domínio de curso, marca como "Infoproduto".
4.  **Interface (Frontend):** Mostra para você o link final extraído, permitindo que você saiba exatamente para onde o lead será enviado ao clicar no botão.
