#!/bin/sh
set -e

echo "FORTE MEDIA - SSL Initialization"
echo "================================"

# Create certs directory if it doesn't exist
mkdir -p /etc/nginx/certs

# Generate SSL certificates if they don't exist
if [ ! -f /etc/nginx/certs/server.crt ] || [ ! -f /etc/nginx/certs/server.key ]; then
    echo "Gerando certificados SSL autoassinados..."
    openssl req -x509 -newkey rsa:4096 -keyout /etc/nginx/certs/server.key -out /etc/nginx/certs/server.crt -days 365 -nodes -subj "/C=BR/ST=SP/L=Sao Paulo/O=FORTE MEDIA/CN=localhost"
    echo "OK: Certificados gerados com sucesso."
else
    echo "OK: Certificados ja existem."
fi

# Start Nginx
echo "Iniciando o servidor Nginx..."
exec nginx -g 'daemon off;'
