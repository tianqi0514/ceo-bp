#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-$(pwd)}"
COMPOSE_FILE="$PROJECT_DIR/deploy/compose/compose.kweaver-dev.yml"
API_BIND="${CEO_BP_KWEAVER_BIND:-127.0.0.1}"
API_PORT="${CEO_BP_KWEAVER_PORT:-19006}"

test "$API_BIND" = "127.0.0.1" || {
  echo "development verification requires loopback bind; found $API_BIND" >&2
  exit 1
}

compose() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

assert_running() {
  local service="$1"
  local container_id
  container_id="$(compose ps -q "$service")"
  test -n "$container_id" || {
    echo "$service container is missing" >&2
    exit 1
  }
  test "$(docker inspect --format '{{.State.Status}}' "$container_id")" = "running" || {
    echo "$service is not running" >&2
    exit 1
  }
}

assert_completed() {
  local service="$1"
  local container_id
  container_id="$(compose ps -a -q "$service")"
  test -n "$container_id" || {
    echo "$service container is missing" >&2
    exit 1
  }
  test "$(docker inspect --format '{{.State.ExitCode}}' "$container_id")" = "0" || {
    echo "$service did not complete successfully" >&2
    exit 1
  }
}

for service in mariadb redis opensearch redpanda vega bkn ontology-query platform-api; do
  assert_running "$service"
done
assert_completed config-init
assert_completed catalog-init

health_json="$(curl --fail --silent --show-error "http://$API_BIND:$API_PORT/health/ready")"
networks_json="$(curl --fail --silent --show-error "http://$API_BIND:$API_PORT/api/v1/knowledge-networks")"

python3 - "$health_json" "$networks_json" <<'PY'
import json
import sys

health = json.loads(sys.argv[1])
networks = json.loads(sys.argv[2])
if health.get("status") != "ready":
    raise SystemExit("platform API is not ready")
if not isinstance(networks.get("items"), list):
    raise SystemExit("knowledge-network response has no items list")
print(
    f"KWeaver development verification passed: "
    f"version={health.get('version')} networks={len(networks['items'])}"
)
PY
