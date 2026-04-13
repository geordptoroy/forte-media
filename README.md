# FORTE MEDIA v3 - Inteligência & Performance

O **FORTE MEDIA** é uma plataforma profissional de inteligência competitiva focada na extração e análise de dados reais da **Meta Ads Library**. Esta versão foi radicalmente reestruturada para focar na captura exaustiva de dados e performance simplificada.

---

## 🚀 Funcionalidades Principais

*   **⛏️ Minerador de Alta Performance:** Busca oficial na API da Meta com filtros de palavra-chave, localização e categoria.
*   **📊 Raio-X de Anúncios:** Captura de métricas reais de escala (impressões, gastos, alcance estimado) e distribuição demográfica completa (idade, gênero e região).
*   **💾 Biblioteca de Favoritos:** Salve criativos com todos os seus metadados ricos para análise de funil e criativos.
*   **🔒 Segurança & Performance:** Gestão simplificada de tokens e cache otimizado para evitar limites da API da Meta.

---

## 🛠️ Tecnologia

- **Frontend:** React 19, TypeScript, TailwindCSS, Vite.
- **Backend:** Node.js, tRPC (Type-safe API), Drizzle ORM.
- **Banco de Dados:** MySQL 8.0.
- **Infraestrutura:** Docker & Docker Compose, Nginx (Proxy Reverso com SSL).

---

## 📦 Como Iniciar

### Pré-requisitos
- Docker e Docker Compose instalados.

### Instalação Simplificada

1. Configure o seu Access Token da Meta no arquivo `.env` na raiz do projeto:
   ```env
   META_ACCESS_TOKEN=seu_token_aqui
   JWT_SECRET=sua_chave_secreta
   ```

2. Suba os containers:
   ```bash
   docker compose up --build
   ```

3. Acesse a plataforma em: **https://localhost**

---

## 📂 Estrutura Refatorada

O projeto foi limpo para manter apenas o essencial e funcional:

- `/client`: Frontend React moderno e otimizado.
- `/server`: Backend robusto com integração profunda com a Meta API.
- `/drizzle`: Definições de esquema sincronizadas com o banco.
- `/nginx`: Configurações de segurança e proxy.

---

**Status:** ✅ Refatoração Completa Concluída | **Versão:** 3.0.0 | **Foco:** Dados Reais da Meta
