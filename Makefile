.PHONY: up down restart logs build clean

# Default command: Start everything
up:
	@if [ ! -f .env ]; then cp .env.example .env && echo "AVISO: .env criado a partir do exemplo. Edite-o se necessario."; fi
	docker compose up -d --build

# Stop everything
down:
	docker compose down

# Restart services
restart:
	docker compose restart

# View logs
logs:
	docker compose logs -f

# Force rebuild
build:
	docker compose build --no-cache

# Clean volumes and images
clean:
	docker compose down -v --rmi all
