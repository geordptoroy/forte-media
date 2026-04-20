# Solução Técnica: Extração de Título e Link de Destino no Backend

Para resolver o problema da exposição da API Key na URL e garantir que o usuário veja o destino final do anúncio sem intermediários, implementamos uma melhoria no motor de extração do sistema.

## 1. O Problema Atual
Anteriormente, o sistema dependia dos dados brutos da API da Meta, que muitas vezes não fornecem o link final de destino (apenas o domínio no campo `ad_creative_link_captions`). Isso forçava o sistema a gerar links que incluíam a sua chave de acesso para que o navegador do usuário pudesse renderizar o anúncio e encontrar o destino.

## 2. A Solução Implementada: Extração Headless
Modificamos o `StealthExtractorService` (localizado no backend em `server/services/stealthExtractorService.ts`) para realizar uma "inspeção profunda" de cada anúncio de forma invisível.

### Como funciona agora:
1.  **Simulação de Navegador:** O backend inicia um navegador Puppeteer (Stealth Mode) que acessa a URL do anúncio.
2.  **Captura de Dados:** Além de extrair o vídeo ou imagem, o script agora localiza:
    *   **O Título Real:** Extrai o texto exato do Call to Action ou título do card.
    *   **O Link de Destino Final:** O script identifica links externos (sites, checkouts, landing pages) e, se houver um redirecionamento da Meta (`l.php?u=`), ele decodifica a URL original no servidor.
3.  **Entrega Limpa:** Esses dados são enviados para o frontend já processados.

## 3. Mudanças no Código

### Backend (`StealthExtractorService.ts`)
Adicionamos a lógica de extração de título e link dentro do `page.evaluate`:
```typescript
const title = document.querySelector('div[role="button"] div > span, h1, h2, h3')?.textContent?.trim();
let ctaLink = externalLink?.getAttribute('href');
// Decodificação de redirecionamento se necessário
if (fbRedirect) {
  const urlObj = new URL(fbRedirect.getAttribute('href'));
  ctaLink = urlObj.searchParams.get('u');
}
```

### Frontend (`AdCardV3.tsx`)
O componente de cartão foi atualizado para priorizar os dados vindos do backend:
*   **Botão CTA:** Agora utiliza o `media.ctaLink` extraído pelo Puppeteer.
*   **Texto do Botão:** Utiliza o `media.title` capturado diretamente da página do anúncio.

## 4. Benefícios
*   **Segurança:** Sua API Key nunca é exposta na URL final para o usuário.
*   **Experiência do Usuário:** O lead é enviado diretamente para o site do anunciante (ou WhatsApp) com um clique limpo.
*   **Precisão:** O título do botão agora reflete exatamente o que está no anúncio original (ex: "Baixar E-book", "Comprar Agora", etc.).

Esta mudança transforma o sistema em uma ferramenta muito mais profissional e segura, centralizando toda a "inteligência" de mineração no servidor.
