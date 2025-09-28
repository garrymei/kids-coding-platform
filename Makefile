.PHONY: dev db-up db-down lint test build install logs status monitor:up monitor:down

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

logs:
	docker compose -f docker/docker-compose.db.yml logs -f

logs-tail:
	node scripts/tail-logs.mjs logs/api.log logs/executor.log

status:
	./scripts/check-status.sh

monitor:up:
	@echo "🚀 Starting monitoring stack..."
	@echo "📊 Prometheus: http://localhost:9090"
	@echo "📈 Grafana: http://localhost:3000"
	@echo "🔍 AlertManager: http://localhost:9093"
	@echo ""
	@echo "Starting Prometheus..."
	@docker run -d --name prometheus \
		-p 9090:9090 \
		-v $(PWD)/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml \
		prom/prometheus:latest || echo "Prometheus already running"
	@echo "Starting Grafana..."
	@docker run -d --name grafana \
		-p 3000:3000 \
		-v $(PWD)/monitoring/grafana:/var/lib/grafana \
		-e GF_SECURITY_ADMIN_PASSWORD=admin \
		grafana/grafana:latest || echo "Grafana already running"
	@echo "Starting AlertManager..."
	@docker run -d --name alertmanager \
		-p 9093:9093 \
		-v $(PWD)/monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml \
		prom/alertmanager:latest || echo "AlertManager already running"
	@echo ""
	@echo "✅ Monitoring stack started successfully!"
	@echo "📋 Available endpoints:"
	@echo "   - Prometheus: http://localhost:9090"
	@echo "   - Grafana: http://localhost:3000 (admin/admin)"
	@echo "   - AlertManager: http://localhost:9093"
	@echo "   - API Health: http://localhost:3000/health"
	@echo "   - Executor Health: http://localhost:4060/health"
	@echo "   - Executor Metrics: http://localhost:4060/metrics"

monitor:down:
	@echo "🛑 Stopping monitoring stack..."
	@docker stop prometheus grafana alertmanager 2>/dev/null || true
	@docker rm prometheus grafana alertmanager 2>/dev/null || true
	@echo "✅ Monitoring stack stopped successfully!"
