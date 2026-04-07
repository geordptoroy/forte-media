#!/bin/sh

# Directory for certificates
CERT_DIR="./nginx/certs"
mkdir -p "$CERT_DIR"

# Generate self-signed certificate if not exists
if [ ! -f "$CERT_DIR/server.crt" ]; then
    echo "Generating self-signed SSL certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$CERT_DIR/server.key" \
        -out "$CERT_DIR/server.crt" \
        -subj "/C=BR/ST=SP/L=SaoPaulo/O=ForteMedia/OU=IT/CN=localhost"
    chmod 644 "$CERT_DIR/server.crt" "$CERT_DIR/server.key"
    echo "SSL certificates generated successfully."
else
    echo "SSL certificates already exist."
fi
