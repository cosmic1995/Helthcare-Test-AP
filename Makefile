.PHONY: help dev build test test-unit test-integration test-e2e lint typecheck security-scan deploy-staging deploy-prod seed clean

# Default target
help: ## Show this help message
	@echo "Healthcare Compliance SaaS - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development
dev: ## Start development environment
	@echo "Starting development environment..."
	npm run dev

build: ## Build all services and web app
	@echo "Building all components..."
	npm run build

# Testing
test: ## Run all tests
	@echo "Running all tests..."
	npm run test

test-unit: ## Run unit tests
	@echo "Running unit tests..."
	npm run test-unit

test-integration: ## Run integration tests
	@echo "Running integration tests..."
	npm run test-integration

test-e2e: ## Run end-to-end tests
	@echo "Running E2E tests..."
	npm run test-e2e

# Code Quality
lint: ## Run linting
	@echo "Running linters..."
	npm run lint

typecheck: ## Run TypeScript type checking
	@echo "Running type checks..."
	npm run typecheck

security-scan: ## Run security scans
	@echo "Running security scans..."
	npm run security-scan

# Infrastructure
infra-plan: ## Plan Terraform infrastructure changes
	@echo "Planning infrastructure changes..."
	cd infra/terraform && terraform plan

infra-apply: ## Apply Terraform infrastructure changes
	@echo "Applying infrastructure changes..."
	cd infra/terraform && terraform apply

# Deployment
deploy-staging: ## Deploy to staging environment
	@echo "Deploying to staging..."
	npm run deploy-staging

deploy-prod: ## Deploy to production environment
	@echo "Deploying to production..."
	npm run deploy-prod

# Database
seed: ## Seed database with sample data
	@echo "Seeding database..."
	npm run seed

# Utilities
clean: ## Clean build artifacts and node_modules
	@echo "Cleaning build artifacts..."
	find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
	find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
	find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# Docker
docker-build: ## Build Docker images for all services
	@echo "Building Docker images..."
	docker build -t healthcare-ingest-api ./services/ingest-api
	docker build -t healthcare-ai-orchestrator ./services/ai-orchestrator
	docker build -t healthcare-alm-adapters ./services/alm-adapters
	docker build -t healthcare-web ./web

docker-run: ## Run services locally with Docker Compose
	@echo "Starting services with Docker Compose..."
	docker-compose up -d

# GCP Setup
gcp-setup: ## Set up GCP project and enable APIs
	@echo "Setting up GCP project..."
	@./scripts/setup-gcp.sh

secrets-setup: ## Set up required secrets in Secret Manager
	@echo "Setting up secrets..."
	@./scripts/setup-secrets.sh
