# Plano de Refatoração: Minerador Pro & Sistema Global

Este plano detalha a refatoração completa da página Minerador e seus componentes, focando em precisão de filtragem, performance de agrupamento e internacionalização.

## 1. Internacionalização (i18n)
Implementar um sistema de tradução robusto para tornar a plataforma global.
- **Tecnologia:** `i18next` + `react-i18next`.
- **Idiomas Iniciais:** Português (BR), Inglês (US), Espanhol (ES).
- **Detecção:** Navegador + Persistência em `localStorage`.
- **Escopo:** Filtros, labels, mensagens de erro e conteúdos estáticos.

## 2. Refatoração do Motor de Classificação (Backend)
Melhorar a precisão dos filtros "Infoproduto", "Quiz", "TSL" e eliminar ruídos (novelas, política indesejada).
- **Lógica de "Negative Keywords":** Adicionar lista de exclusão (ex: "novela", "capítulo", "episódio", "política", "eleição") para limpar os resultados.
- **Detecção de Idioma do Anúncio:** Usar biblioteca de detecção de linguagem no backend para classificar anúncios por idioma original.
- **Filtros de Nicho Específicos:**
    - **Quiz:** Buscar por padrões de URL (`/quiz`, `/teste`, `/pergunta`) e CTAs interativos.
    - **Infoproduto:** Cruzar palavras-chave com domínios conhecidos de checkout (Hotmart, Kiwify, Eduzz).
- **Agrupamento de Criativos (Collation):** Melhorar o `generateCreativeHash` para ignorar variações irrelevantes (emojis, espaços extras) e garantir que o `collationCount` seja preciso entre diferentes buscas.

## 3. Refatoração da Página Minerador (Frontend)
Otimizar a lógica de estado e filtros locais para evitar lentidão e comportamentos erráticos.
- **Filtros Sincronizados:** Mover a lógica de filtros de escala e duração para o backend (via tRPC) para garantir que a paginação funcione corretamente com os filtros aplicados.
- **Gerenciamento de Estado:** Usar `Zustand` ou `Context API` para gerenciar filtros globais, evitando prop-drilling e re-renderizações desnecessárias.
- **Virtualização de Lista:** Implementar `react-window` ou `tanstack-virtual` se o número de anúncios crescer muito, mantendo a fluidez da página.

## 4. Componentes (AdCardV3 e Filtros)
- **AdCardV3:** Integrar os novos dados de escala e metadados de idioma.
- **Filtros:** Adicionar um seletor de idioma global no header e traduzir todas as opções de categorias.

## 5. Estratégia de Execução
1.  **Fase 1 (Backend):** Atualizar `metaAdsService.ts` com novas keywords, detecção de idioma e filtros negativos.
2.  **Fase 2 (i18n):** Configurar `i18next` e envolver a aplicação com o provider.
3.  **Fase 3 (Frontend):** Refatorar `Minerador.tsx` para usar os novos parâmetros do backend e remover lógica local redundante.
4.  **Fase 4 (Deploy):** Testar com a API Key real e realizar o push para o GitHub.

---
**Meta:** Transformar o Minerador em uma ferramenta de espionagem de nível mundial, com zero ruído e máxima precisão.
