#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-$(pwd)}"
COMPOSE_FILE="$PROJECT_DIR/deploy/compose/compose.demo.yml"

"$PROJECT_DIR/deploy/scripts/preflight-demo.sh" "$PROJECT_DIR"

export CEO_BP_BUILD_SHA="${CEO_BP_BUILD_SHA:-$(git -C "$PROJECT_DIR" rev-parse --short=12 HEAD)}"
export CEO_BP_VERSION="${CEO_BP_VERSION:-0.2.0}"

docker compose -p ceo-bp -f "$COMPOSE_FILE" build platform-api
docker compose -p ceo-bp -f "$COMPOSE_FILE" up -d --no-deps platform-api
docker compose -p ceo-bp -f "$COMPOSE_FILE" ps
