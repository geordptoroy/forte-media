# FORTE MEDIA - Security Guidelines

**Last Updated:** 31 de Março de 2026  
**Version:** 2.0 - Production Ready

---

## 1. Segurança de Credenciais

### 1.1 Criptografia de Credenciais Meta

Todas as credenciais da Meta Ads API são armazenadas criptografadas com **AES-256-GCM**:

```typescript
// Algoritmo: AES-256-GCM
// IV: 16 bytes aleatórios (gerado por cada criptografia)
// Auth Tag: 16 bytes (verificação de integridade)
// Chave: 32 bytes (ENCRYPTION_KEY)
// Formato de armazenamento: [IV (32 hex)] + [Auth Tag (32 hex)] + [Encrypted Data]
```

**Nunca** armazene credenciais em plaintext ou em ficheiros de configuração.

### 1.2 Validação de Credenciais

Todas as credenciais são validadas com a Meta API antes do armazenamento:

1. **Token de Acesso:** Verificação de permissões (ads_read, ads_management)
2. **App ID e App Secret:** Validação com Graph API
3. **Ad Account ID:** Verificação de existência e acesso

### 1.3 Rotação de Credenciais

Implemente rotação de credenciais a cada 90 dias:

```bash
# Gerar novo token de longa duração (60 dias)
# Atualizar em Configurações > Credenciais Meta
# Remover credencial antiga após confirmação
```

---

## 2. Segurança de Cookies e Sessões

### 2.1 Configuração de Cookies

```typescript
// Production settings (MUST be enabled)
COOKIE_SECURE=true           // HTTPS only
COOKIE_SAME_SITE=strict      // CSRF protection
COOKIE_HTTP_ONLY=true        // XSS protection
```

### 2.2 Sessão

- Duração máxima: 24 horas
- Renovação automática a cada 6 horas
- Invalidação ao logout
- Verificação de IP (recomendado)

---

## 3. Autenticação e Autorização

### 3.1 Autenticação

- Email + Password (local)
- Hashing: bcrypt com salt rounds = 12
- Validação de força de senha: mínimo 6 caracteres

### 3.2 Autorização

- Role-based access control (RBAC)
- Roles: user, admin
- Verificação em cada endpoint protegido

---

## 4. CORS e Headers de Segurança

### 4.1 CORS Configuration

```typescript
// Production CORS
CORS_ORIGIN=https://your-domain.com
```

### 4.2 Security Headers

```nginx
# Nginx configuration
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## 5. Proteção contra Ataques Comuns

### 5.1 SQL Injection

- ✅ Usar Drizzle ORM com parameterized queries
- ✅ Nunca concatenar SQL strings
- ✅ Validar entrada com Zod schemas

### 5.2 XSS (Cross-Site Scripting)

- ✅ React sanitiza automaticamente
- ✅ Usar `dangerouslySetInnerHTML` apenas com conteúdo de confiança
- ✅ Content Security Policy (CSP) headers

### 5.3 CSRF (Cross-Site Request Forgery)

- ✅ CSRF tokens em formulários
- ✅ SameSite cookies (strict)
- ✅ Verificação de origin/referer

### 5.4 Rate Limiting

```typescript
// Implementar rate limiting por IP/utilizador
// Limites recomendados:
// - Login: 5 tentativas/5 minutos
// - API: 100 chamadas/minuto por utilizador
// - Search: 10 chamadas/minuto por utilizador
```

---

## 6. Proteção de Dados

### 6.1 Dados Sensíveis

Nunca registar (log):
- Tokens de acesso
- App Secrets
- Senhas de utilizadores
- Dados financeiros

### 6.2 Conformidade GDPR

- Direito ao esquecimento: implementar soft delete
- Portabilidade de dados: exportar em JSON
- Consentimento: obter antes de processar dados
- Notificação de violação: dentro de 72 horas

### 6.3 Backup e Recuperação

```bash
# Backup diário da database
docker exec forte-media-db mysqldump -u root -p$DB_ROOT_PASSWORD $DB_NAME > backup.sql

# Armazenar em local seguro (AWS S3, Google Cloud Storage, etc.)
# Testar recuperação regularmente
```

---

## 7. Infraestrutura e Deploy

### 7.1 Docker Security

```yaml
# docker-compose.yml
security_opt:
  - no-new-privileges:true
cap_drop:
  - ALL
cap_add:
  - NET_BIND_SERVICE
read_only_root_filesystem: true
```

### 7.2 Network Security

- Usar private network (172.20.0.0/16)
- Firewall: bloquear tráfego não autorizado
- VPN para acesso administrativo
- WAF (Web Application Firewall) em produção

### 7.3 HTTPS/TLS

- Certificado SSL/TLS válido (Let's Encrypt)
- TLS 1.2 mínimo (1.3 recomendado)
- Renovação automática de certificados
- HSTS headers habilitados

---

## 8. Monitoramento e Logging

### 8.1 Logs de Segurança

Registar:
- Tentativas de login falhadas
- Mudanças de credenciais
- Acesso a dados sensíveis
- Erros de validação

### 8.2 Alertas

Configurar alertas para:
- Múltiplas tentativas de login falhadas
- Acesso de IP desconhecido
- Mudanças em credenciais
- Erros de database

### 8.3 Auditoria

Manter log de auditoria com:
- Timestamp
- Utilizador
- Ação
- Resultado
- IP/User-Agent

---

## 9. Checklist de Segurança para Produção

### Antes do Deploy

- [ ] ENCRYPTION_KEY gerada e segura (32 caracteres)
- [ ] SESSION_SECRET gerada e segura
- [ ] Senhas de database alteradas
- [ ] CORS_ORIGIN configurado corretamente
- [ ] HTTPS/TLS certificado válido
- [ ] Variáveis de ambiente não commitadas
- [ ] Secrets armazenados em secrets manager
- [ ] Database backups configurados
- [ ] Monitoramento e logging ativados
- [ ] WAF configurado (se aplicável)

### Após o Deploy

- [ ] Testar autenticação e autorização
- [ ] Testar CORS e headers de segurança
- [ ] Verificar logs de segurança
- [ ] Testar rate limiting
- [ ] Verificar certificado SSL/TLS
- [ ] Testar backup e recuperação
- [ ] Executar security scan
- [ ] Verificar conformidade GDPR
- [ ] Documentar procedimentos de segurança
- [ ] Treinar equipa em segurança

---

## 10. Incidentes de Segurança

### 10.1 Resposta a Incidentes

1. **Detecção:** Monitoramento contínuo
2. **Contenção:** Isolar sistema afetado
3. **Investigação:** Analisar logs e impacto
4. **Remediação:** Corrigir vulnerabilidade
5. **Recuperação:** Restaurar operações normais
6. **Notificação:** Informar utilizadores (se necessário)
7. **Documentação:** Registar lições aprendidas

### 10.2 Contacto de Segurança

- **Email:** security@forte-media.com
- **Telefone:** +1-XXX-XXX-XXXX
- **Responsável:** Chief Security Officer

---

## 11. Recursos de Segurança

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Docker Security](https://docs.docker.com/engine/security/)
- [GDPR Compliance](https://gdpr-info.eu/)

---

## 12. Atualizações de Segurança

Manter dependências atualizadas:

```bash
# Verificar vulnerabilidades
npm audit

# Atualizar dependências
npm update

# Verificar dependências desatualizadas
npm outdated
```

---

**Documento Preparado por:** Manus AI  
**Última Atualização:** 31 de Março de 2026  
**Versão:** 2.0 - Production Ready

**Nota:** Este documento deve ser revisado e atualizado regularmente, pelo menos a cada trimestre.
