# Análise Técnica: Filtros de Produto e Funil (Forte Media)

O repositório `geordptoroy/forte-media` contém uma plataforma avançada de mineração e análise de anúncios da Meta (Facebook/Instagram). Diferente do repositório anterior, este possui uma implementação robusta de **inteligência de classificação** baseada em palavras-chave e pesos.

## 1. Como o sistema identifica o Tipo de Produto?

A identificação é realizada no servidor através de um "Motor de Classificação" (`CLASSIFICATION_ENGINE`) localizado no arquivo `server/services/metaAdsService.ts`. O sistema utiliza uma técnica de **análise léxica com pesos**.

### Mecanismo de Pontuação
Para cada anúncio, o sistema combina o texto do corpo (`ad_creative_bodies`), o título (`ad_creative_link_titles`) e a descrição (`ad_creative_link_descriptions`). Ele então aplica as seguintes regras:

| Peso | Descrição |
| :--- | :--- |
| **3 pontos** | Palavras-chave de alta relevância (`high`) |
| **1 ponto** | Palavras-chave de média relevância (`medium`) |

### Critérios para Infoprodutos
Para classificar um anúncio como **Infoproduto**, o sistema busca os seguintes termos:

*   **Alta Relevância (3 pts):** curso, treinamento, método, fórmula, mentoria, workshop, e-book, aula gratuita, vagas abertas, inscrição.
*   **Média Relevância (1 pt):** digital, online, aprenda, conteúdo, acesso, vitalício, baixe agora, módulo.

O anúncio é rotulado com o tipo que obtiver a maior pontuação acumulada.

---

## 2. Como o sistema identifica o Funil (Quiz, TSL, VSL)?

A lógica para identificar a estrutura do funil segue o mesmo princípio de pontuação por palavras-chave, focando em elementos da jornada do usuário e chamadas para ação (CTAs).

### Identificação de Quiz
O sistema classifica como **Quiz** quando detecta termos que indicam interatividade e descoberta personalizada:
*   **Termos Chave:** quiz, teste, descubra seu, perguntas, resultado personalizado, perfil, responda, faça o teste, questionário.

### Identificação de TSL (Text Sales Letter)
A **TSL** é identificada por termos de venda direta e escassez textual:
*   **Termos Chave:** checkout, pagamento, compre agora, clique aqui, carrinho, finalizar compra, r$, preço, oferta irresistível, garantia de 7 dias.

### Identificação de VSL (Video Sales Letter)
O sistema diferencia TSL de **VSL** focando em termos relacionados ao consumo de vídeo:
*   **Termos Chave:** assista ao vídeo, aperte o play, vídeo explicativo, veja o vídeo, vsl, vídeo de vendas, reproduzir vídeo.

---

## 3. Resumo dos Filtros de Funil

Abaixo, apresentamos os critérios utilizados para as principais estruturas de funil mapeadas no sistema:

| Tipo de Funil | Palavras-chave de Alta Relevância (Exemplos) |
| :--- | :--- |
| **Quiz** | `quiz`, `teste`, `descubra seu`, `responda`, `faça o teste` |
| **TSL** | `checkout`, `compre agora`, `carrinho`, `r$`, `garantia` |
| **VSL** | `assista ao vídeo`, `aperte o play`, `vsl`, `vídeo de vendas` |
| **X1 (WhatsApp)** | `whatsapp`, `chamar no`, `falar com`, `contate-nos` |
| **Type Bot** | `bot`, `assistente virtual`, `chat inteligente`, `ia assistente` |

## 4. Fluxo de Processamento

1.  **Captura:** O sistema busca anúncios brutos via API da Meta (`ads_archive`).
2.  **Normalização:** Todos os textos são convertidos para minúsculas e limpos.
3.  **Classificação:** A função `classifyAd` varre os textos em busca das palavras-chave predefinidas.
4.  **Atribuição:** Os resultados são anexados ao objeto do anúncio nos campos `detectedTypes` e `detectedFunnels`.
5.  **Filtragem:** O usuário, no frontend (`Minerador.tsx`), seleciona os filtros que deseja, e o sistema exibe apenas os anúncios cujas tags detectadas coincidem com a escolha.

Este método permite uma classificação rápida e escalável sem a necessidade de processar a página de destino (landing page) em tempo real para cada busca, embora o sistema também possua serviços de extração (`StealthExtractorService`) para análises mais profundas.
