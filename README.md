# 🚀 FORTE MEDIA v3 - Intelligence & Performance Dashboard

Uma plataforma profissional de inteligência competitiva focada em anúncios do Meta (Facebook/Instagram), simplificada para máxima performance e facilidade de uso.

Esta versão foi radicalmente reestruturada para focar no que realmente importa: **Mineração de Criativos** e **Anúncios Escalados**, com configuração simplificada via variáveis de ambiente.

---

## 🛠️ Funcionalidades Principais

*   **🏆 Escalados:** Exibição diária dos 50 anúncios com maior tração e escala detectados pelo nosso algoritmo na Meta Ad Library.
*   **⛏️ Minerador:** Busca poderosa por nichos e palavras-chave para encontrar criativos validados em qualquer região do mundo.
*   **📊 Algoritmo de Score v4:** Sistema inteligente que analisa longevidade (>60 dias), volume de criativos e sinais de investimento para classificar o nível de escala de cada anúncio.
*   **🔒 Configuração Simplificada:** Sem necessidade de configurar credenciais na interface. Tudo é gerido via `META_ACCESS_TOKEN` no servidor.

---

## 🚀 Como Iniciar (Docker)

A plataforma está totalmente automatizada. Para iniciar tudo (Base de Dados, Backend, Frontend, SSL e Migrations), basta um comando:

### Windows (PowerShell)
```powershell
.\docker-start.ps1
```

### Linux / macOS (Makefile)
```bash
make up
```
*Ou simplesmente:* `docker compose up -d --build`

Aceda em: **https://localhost**

---

## ⚙️ Configuração de Ambiente (.env)

Para que a mineração funcione, você **deve** configurar o seu Access Token da Meta no arquivo `.env` na raiz do projeto:

```env
# --- META API (CONFIGURAÇÃO GLOBAL) ---
# Obtenha o User Access Token em https://developers.facebook.com/tools/explorer/
# Necessário permissão: ads_read
META_ACCESS_TOKEN=seu_access_token_aqui

# --- SEGURANÇA ---
JWT_SECRET=uma_chave_secreta_longa
ENCRYPTION_KEY=chave_de_32_caracteres_exatos

# --- BANCO DE DADOS (DOCKER) ---
DB_USER=forte_user
DB_PASSWORD=forte_password
DB_NAME=forte_media
```

---

## 📁 Estrutura Simplificada

O projeto foi limpo para manter apenas o essencial:

| Página | Descrição |
| :--- | :--- |
| **Escalados** | Os 50 campeões do dia (atualizado às 00:00). |
| **Minerador** | Busca livre por nichos com filtro de score em tempo real. |
| **Configurações** | Gestão de perfil e segurança da conta. |

---

## 🛠️ Comandos Úteis

*   **Logs em tempo real:** `docker-compose logs -f`
*   **Reiniciar serviços:** `docker-compose restart`
*   **Limpar tudo:** `docker-compose down -v`

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Status:** ✅ Reestruturação Radical Concluída | **Versão:** 3.0.0 | **Stack:** React 19 + tRPC + Drizzle
