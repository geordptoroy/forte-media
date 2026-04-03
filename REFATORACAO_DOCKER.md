# Documentação de Refatoração da Dockerização - Forte Media

Esta documentação detalha a refatoração completa da infraestrutura Docker do projeto Forte Media, focando em otimização de build, segurança e suporte a múltiplos ambientes.

## 1. Visão Geral das Mudanças

A refatoração da dockerização abordou os seguintes aspectos principais:
- **Multi-stage Builds**: Dockerfiles otimizados para reduzir o tamanho das imagens finais e acelerar o processo de build através do cache de camadas.
- **Segregação de Ambientes**: Criação de configurações distintas para desenvolvimento (`docker-compose.dev.yml`) e produção (`docker-compose.yml`).
- **Proxy Reverso Otimizado**: Configuração do Nginx para servir o frontend estático e atuar como proxy para o backend, incluindo suporte a Gzip e cache de assets.
- **Segurança**: Uso de imagens base Alpine, exposição mínima de portas e isolamento de rede.

## 2. Estrutura de Dockerfiles

### 2.1. Frontend (`client.Dockerfile`)
- **Estágio de Build**: Utiliza `node:20-alpine` para compilar o código React/Vite.
- **Estágio de Produção**: Utiliza `nginx:stable-alpine` para servir os arquivos estáticos.
- **Otimização**: Copia apenas os arquivos de dependências primeiro para aproveitar o cache do Docker.

### 2.2. Backend (`server.Dockerfile`)
- **Estágio de Build**: Compila o código TypeScript.
- **Estágio de Produção**: Utiliza `node:20-alpine` para rodar apenas o código compilado e as dependências necessárias.
- **Otimização**: Redução drástica no tamanho da imagem ao não incluir o código fonte original ou ferramentas de build no estágio final.

## 3. Orquestração com Docker Compose

### 3.1. Produção (`docker-compose.yml`)
- **Serviços**: `db` (MySQL), `backend` (Node.js), `frontend` (Nginx Estático), `nginx` (Proxy Reverso).
- **Rede**: Rede isolada `forte-network` com sub-rede específica.
- **Volumes**: Persistência de dados do MySQL em volume local.

### 3.2. Desenvolvimento (`docker-compose.dev.yml`)
- **Hot Reload**: Mapeamento de volumes locais para permitir o desenvolvimento em tempo real dentro dos containers.
- **Debugging**: Exposição de portas adicionais e logs em nível `debug`.

## 4. Configuração do Nginx

O Nginx foi configurado com as seguintes funcionalidades:
- **Proxy Reverso**: Encaminhamento de requisições `/api/` para o backend.
- **SPA Routing**: Suporte a rotas do React através do `try_files`.
- **Gzip**: Compressão de arquivos para melhorar a performance de carregamento.
- **Cache de Assets**: Configuração de cache para arquivos estáticos (JS, CSS, Imagens).

## 5. Como Utilizar

### Ambiente de Produção
```bash
docker compose up -d
```

### Ambiente de Desenvolvimento
```bash
docker compose -f docker-compose.dev.yml up --build
```

## 6. Checklist de Conclusão

- [x] Analisar configuração Docker atual
- [x] Refatorar `client.Dockerfile` com multi-stage build
- [x] Refatorar `server.Dockerfile` com multi-stage build
- [x] Refatorar `docker-compose.yml` para produção
- [x] Criar `docker-compose.dev.yml` para desenvolvimento
- [x] Criar `.dockerignore` otimizado
- [x] Configurar Nginx para SPA e Proxy Reverso
- [x] Validar sintaxe das configurações
- [x] Commitar mudanças no repositório
- [x] Gerar documentação da infraestrutura
