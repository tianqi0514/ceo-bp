.PHONY: docs lock test lint typecheck verify

docs:
	python3 tools/validate_docs.py

lock:
	cd services/platform-api && uv lock --python 3.12 && uv export --frozen --no-dev --no-hashes --no-emit-project --output-file requirements.txt

test:
	cd services/platform-api && uv run --frozen pytest

lint:
	cd services/platform-api && uv run --frozen ruff check .

typecheck:
	cd services/platform-api && uv run --frozen mypy

verify: docs lint typecheck test
