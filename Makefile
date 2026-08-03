.PHONY: docs lock backend-verify frontend-verify test lint typecheck verify

docs:
	python3 tools/validate_docs.py

lock:
	cd services/platform-api && uv lock --python 3.12 && uv export --frozen --no-dev --no-hashes --no-emit-project --output-file requirements.txt

test:
	cd services/platform-api && uv run --frozen pytest
	cd apps/console && npm test

lint:
	cd services/platform-api && uv run --frozen ruff check .

typecheck:
	cd services/platform-api && uv run --frozen mypy

backend-verify: lint typecheck
	cd services/platform-api && uv run --frozen pytest

frontend-verify:
	cd apps/console && npm ci --no-audit --no-fund
	cd apps/console && npm run check
	cd apps/console && npm run typecheck
	cd apps/console && npm run test:coverage
	cd apps/console && npm run build

verify: docs backend-verify frontend-verify
