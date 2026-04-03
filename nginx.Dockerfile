FROM nginx:stable-alpine

# Instalar utilitários necessários
RUN apk add --no-cache openssl wget netcat-openbsd

# Copiar configurações
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY scripts/init-ssl.sh /usr/local/bin/init-ssl.sh

# Garantir permissões e formato LF para o script
RUN chmod +x /usr/local/bin/init-ssl.sh && \
    sed -i 's/\r$//' /usr/local/bin/init-ssl.sh

# Criar diretório para certificados
RUN mkdir -p /etc/nginx/certs

EXPOSE 80 443

# Healthcheck interno
HEALTHCHECK --interval=15s --timeout=10s --retries=3 --start-period=10s \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Usar o script de inicialização SSL como entrypoint
ENTRYPOINT ["/bin/sh", "/usr/local/bin/init-ssl.sh"]
