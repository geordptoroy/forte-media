# 🚀 Guia de Integração: Conectando seu Frontend à API Forte Media

Este documento explica como conectar qualquer frontend (React, Vue, Mobile, etc.) ao backend refatorado do Forte Media. A API foi isolada para funcionar de forma independente e robusta.

---

## 📡 1. Endereço da API

Por padrão, a API escuta na porta **4000**.
- **Desenvolvimento Local:** `http://localhost:4000`
- **Produção (Docker):** `http://seu-dominio.com/api` (via Nginx) ou `http://IP-DO-SERVIDOR:4000`

---

## 🛠 2. Tecnologias de Conexão

A API utiliza **tRPC v11** para comunicação tipada, mas também expõe endpoints REST básicos para healthcheck e notificações.

### Recomendação: Usar tRPC Client
Para frontends em TypeScript/JavaScript, a melhor forma de consumir é usando o `@trpc/client`.

#### Instalação:
```bash
npm install @trpc/client @trpc/server @trpc/react-query @tanstack/react-query zod
```

#### Configuração do Cliente:
```typescript
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './path-to-backend/server/routers'; // Importe apenas o TIPO

export const api = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:4000/api/trpc',
      // Importante para autenticação baseada em cookies
      headers: () => ({
        // Adicione headers customizados se necessário
      }),
    }),
  ],
});
```

---

## 🔐 3. Autenticação

A autenticação é baseada em **Cookies HTTP-Only** para máxima segurança contra ataques XSS.

1. **Login:** Chame `auth.login` com `email` e `password`.
2. **Sessão:** O backend enviará um cookie `session_token`.
3. **Persistência:** O navegador enviará este cookie automaticamente em todas as requisições subsequentes.
4. **CORS:** A API já está configurada com `credentials: true` para aceitar esses cookies de origens externas.

---

## 📂 4. Estrutura de Endpoints (Routers)

A API é dividida em módulos lógicos:

| Módulo | Descrição | Principais Procedures |
| :--- | :--- | :--- |
| `auth` | Gestão de usuários e sessão | `login`, `register`, `me`, `logout` |
| `meta` | Integração com Facebook/Instagram | `setCredentials`, `getCredentialsStatus`, `searchAds` |
| `ads` | Gestão de favoritos | `getFavorites`, `addFavorite`, `removeFavorite` |
| `monitoring` | Monitoramento de concorrência | `getMonitored`, `addMonitored`, `updateStatus` |
| `campaigns` | Performance de anúncios próprios | `listCampaigns`, `getCampaignMetrics` |

---

## 📊 5. Exemplo de Busca de Anúncios (Meta API)

```typescript
// Exemplo de como buscar anúncios da biblioteca da Meta
const results = await api.meta.searchAds.query({
  searchTerms: ["marketing digital", "iphone"],
  countries: ["BR"],
  limit: 20
});

console.log(results.ads); // Lista de anúncios com todos os campos da Meta
```

---

## 🔔 6. Notificações em Tempo Real (SSE)

O backend expõe um endpoint de **Server-Sent Events (SSE)** para notificações push.

**Endpoint:** `GET /api/notifications/stream`

```javascript
const eventSource = new EventSource('http://localhost:4000/api/notifications/stream', {
  withCredentials: true
});

eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  console.log("Nova notificação:", notification);
};
```

---

## 🐳 7. Deploy e CORS

Se o seu frontend estiver em um domínio diferente do backend (ex: `app.meusite.com` vs `api.meusite.com`):

1. No `docker-compose.yml` do backend, ajuste a variável `CORS_ORIGIN`.
2. Certifique-se de que o Nginx está configurado para passar os headers de `Set-Cookie`.

---

## 🧪 8. Testando a Conexão

Você pode verificar se a API está online acessando:
`GET http://localhost:4000/health`

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2026-04-02T..."
}
```
