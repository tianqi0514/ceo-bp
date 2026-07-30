#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-$(pwd)}"
COMPOSE_FILE="$PROJECT_DIR/deploy/compose/compose.demo.yml"
PUBLIC_PORT="${CEO_BP_PORT:-9006}"

command -v docker >/dev/null 2>&1 || {
  echo "docker is required" >&2
  exit 1
}
command -v ss >/dev/null 2>&1 || {
  echo "Linux iproute (ss) is required" >&2
  exit 1
}
test -r /proc/meminfo || {
  echo "Linux /proc/meminfo is required" >&2
  exit 1
}

docker compose version >/dev/null

test -f "$COMPOSE_FILE" || {
  echo "compose file not found: $COMPOSE_FILE" >&2
  exit 1
}

existing_id="$(docker compose -p ceo-bp -f "$COMPOSE_FILE" ps -q platform-api 2>/dev/null || true)"
if ss -lntH "sport = :$PUBLIC_PORT" | grep -q . && test -z "$existing_id"; then
  echo "port $PUBLIC_PORT is already used by another service" >&2
  exit 1
fi

available_kib="$(awk '/MemAvailable:/ {print $2}' /proc/meminfo)"
if test "${available_kib:-0}" -lt 524288; then
  echo "less than 512 MiB memory available; refusing deployment" >&2
  exit 1
fi

echo "preflight passed: project=ceo-bp port=$PUBLIC_PORT"
