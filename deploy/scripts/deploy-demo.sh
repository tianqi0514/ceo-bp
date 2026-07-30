#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-$(pwd)}"
COMPOSE_FILE="$PROJECT_DIR/deploy/compose/compose.demo.yml"

"$PROJECT_DIR/deploy/scripts/preflight-demo.sh" "$PROJECT_DIR"

export CEO_BP_BUILD_SHA="${CEO_BP_BUILD_SHA:-$(git -C "$PROJECT_DIR" rev-parse --short=12 HEAD)}"
export CEO_BP_VERSION="${CEO_BP_VERSION:-0.3.0}"

if test "${CEO_BP_SKIP_BUILD:-0}" = "1"; then
  docker image inspect "ceo-bp/platform-api:$CEO_BP_VERSION" >/dev/null
else
  docker compose -p ceo-bp -f "$COMPOSE_FILE" build platform-api
fi

docker compose -p ceo-bp -f "$COMPOSE_FILE" up -d --no-build --no-deps platform-api
docker compose -p ceo-bp -f "$COMPOSE_FILE" ps
