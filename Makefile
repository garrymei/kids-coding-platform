.PHONY: dev db-up db-down lint test build install

install:
	pnpm install

db-up:
	docker compose -f docker/docker-compose.db.yml up -d

db-down:
	docker compose -f docker/docker-compose.db.yml down

lint:
	pnpm lint

test:
	pnpm -r --if-present test

build:
	pnpm -r build

dev:
	./scripts/dev.sh
