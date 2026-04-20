# Análise Técnica: Extração de Links de Destino e Identificação de Funis (Forte Media)

No sistema Forte Media, a identificação do link para onde o anunciante deseja que o lead vá (site, WhatsApp, etc.) é um processo que envolve a **extração direta de URLs** dos dados do anúncio e a **inferência do tipo de funil** com base no conteúdo textual do criativo.

## 1. Origem dos Dados do Anúncio

Os dados brutos dos anúncios são obtidos da **Meta Ads Library API**. Esta API fornece diversas informações sobre os anúncios veiculados, incluindo os textos dos criativos e, em alguns casos, URLs diretas.

## 2. Extração do Link de Destino (`destination_url`)

A lógica principal para extrair o link de destino é implementada na função `searchAds` dentro do arquivo `server/services/metaAdsService.ts`. O processo segue uma hierarquia de prioridade:

1.  **`ad_creative_link_captions`**: O sistema primeiramente tenta encontrar uma URL nos *captions* (legendas de link) do criativo do anúncio. Este é o local mais comum para URLs de destino explícitas.
2.  **`ad_creative_bodies`, `ad_creative_link_titles`, `ad_creative_link_descriptions`**: Se nenhuma URL for encontrada nos *captions*, o sistema realiza uma busca por expressões regulares (`urlRegex = /(https?:\/\/[^\s"'<>]+)/g;`) em todos os campos de texto do criativo (corpo, títulos e descrições de link).
    *   Durante essa busca, URLs que contenham `facebook.com` ou `fb.me` são **excluídas** para garantir que o link extraído seja o destino final do anunciante, e não um link interno da Meta.
3.  **`ad_snapshot_url` (Fallback)**: Caso nenhuma URL seja encontrada nos campos acima, o sistema utiliza a `ad_snapshot_url` como um fallback. Esta URL geralmente aponta para uma página estática da Meta que exibe o anúncio, e não é o destino desejado para o lead, mas serve como um ponto de partida para análise posterior.

O link de destino final é armazenado no campo `destination_url` do objeto do anúncio processado.

## 3. Identificação do Tipo de Funil (Quiz, TSL, VSL, X1)

A diferenciação entre funis como Quiz, TSL (Text Sales Letter) ou X1 (WhatsApp) não é feita diretamente pela `destination_url`, mas sim pelo **Motor de Classificação** (`CLASSIFICATION_ENGINE`) que analisa o conteúdo textual do anúncio. Este motor, também localizado em `server/services/metaAdsService.ts`, utiliza palavras-chave com pesos para inferir a intenção do anunciante.

### Exemplos de Identificação de Funil:

*   **Funil Quiz**: Detectado por palavras-chave como "quiz", "teste", "perguntas", "descubra seu", "responda", indicando uma interação para qualificação do lead.
*   **Funil TSL (Text Sales Letter)**: Identificado por termos de venda direta e escassez, como "checkout", "pagamento", "compre agora", "clique aqui", "carrinho", "oferta irresistível", "garantia de 7 dias".
*   **Funil VSL (Video Sales Letter)**: Reconhecido por chamadas para assistir a vídeos, como "assista ao vídeo", "aperte o play", "vídeo explicativo", "veja o vídeo", "vsl".
*   **Funil X1 (WhatsApp)**: Classificado por termos que indicam contato direto via WhatsApp ou chat, como "whatsapp", "conversa", "falar com", "chamar no", "contate-nos".

### Processo de Inferência:

1.  O texto combinado do anúncio (corpo, título, descrição) é analisado.
2.  Palavras-chave específicas para cada tipo de funil são pontuadas (3 pontos para alta relevância, 1 ponto para média relevância).
3.  O funil com a maior pontuação é atribuído ao anúncio no campo `detectedFunnels`.

## 4. Serviço de Extração Stealth (`StealthExtractorService`)

O `StealthExtractorService` (em `server/services/stealthExtractorService.ts`) é um serviço separado que utiliza Puppeteer (um navegador headless) para realizar uma **extração profunda de mídias** (vídeos, imagens, carrosséis) a partir da `ad_snapshot_url` (a URL da página de visualização do anúncio na Meta). Este serviço não tem como objetivo principal determinar o *link de destino final* para onde o lead é enviado, mas sim obter os ativos de mídia (vídeos e imagens) do criativo do anúncio para análise visual.

Ele tenta uma extração rápida via regex no HTML bruto e, se falhar, usa o Puppeteer para renderizar a página e extrair os elementos de mídia. Embora possa encontrar URLs de mídia, ele não é o componente responsável por identificar o link de destino do anunciante para fins de conversão de leads.

## Conclusão

O Forte Media extrai o link de destino de um anúncio diretamente dos metadados fornecidos pela Meta Ads Library API, priorizando os *captions* e buscando URLs nos textos do criativo. A identificação do tipo de funil (Quiz, TSL, X1, etc.) é uma camada de inteligência adicional que classifica a *estratégia* do anúncio com base em palavras-chave, e não diretamente no link de destino em si. O `StealthExtractorService` foca na extração de mídias do snapshot do anúncio, e não na determinação do link de conversão do lead.
