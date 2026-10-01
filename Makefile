.PHONY: help build up down test seed lint clean

help:
	@echo "CYBERRANGE - Attack Detection & Investigation Lab"
	@echo "=================================================="
	@echo "make build       - Build all Docker containers"
	@echo "make up          - Start the entire stack in Docker"
	@echo "make down        - Stop and remove Docker containers"
	@echo "make seed        - Populate database with synthetic SOC events & scenarios"
	@echo "make test        - Run backend pytest test suite"
	@echo "make test-front  - Run frontend build & test"
	@echo "make dev-backend - Run local FastAPI dev server"
	@echo "make dev-front   - Run local Vite frontend dev server"

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

seed:
	python scripts/seed_database.py

test:
	pytest backend/tests -v

test-front:
	cd frontend && npm run build

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-front:
	cd frontend && npm run dev

clean:
	rm -rf backend/__pycache__ frontend/dist
