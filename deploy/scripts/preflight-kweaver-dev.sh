#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-$(pwd)}"
COMPOSE_FILE="$PROJECT_DIR/deploy/compose/compose.kweaver-dev.yml"
LOCKED_COMMIT="b9b35fb245c31660127114c883e91165b42dc8f0"

command -v docker >/dev/null 2>&1 || {
  echo "docker is required" >&2
  exit 1
}
command -v git >/dev/null 2>&1 || {
  echo "git is required" >&2
  exit 1
}
docker compose version >/dev/null

test -f "$COMPOSE_FILE" || {
  echo "compose file not found: $COMPOSE_FILE" >&2
  exit 1
}
test -n "${KWEAVER_CORE_DIR:-}" || {
  echo "KWEAVER_CORE_DIR is required" >&2
  exit 1
}
test -n "${CEO_BP_KWEAVER_DB_PASSWORD:-}" || {
  echo "CEO_BP_KWEAVER_DB_PASSWORD is required" >&2
  exit 1
}
test -n "${CEO_BP_KWEAVER_DB_ROOT_PASSWORD:-}" || {
  echo "CEO_BP_KWEAVER_DB_ROOT_PASSWORD is required" >&2
  exit 1
}
test "$CEO_BP_KWEAVER_DB_PASSWORD" != "$CEO_BP_KWEAVER_DB_ROOT_PASSWORD" || {
  echo "database user and root passwords must differ" >&2
  exit 1
}

actual_commit="$(git -C "$KWEAVER_CORE_DIR" rev-parse HEAD 2>/dev/null || true)"
test "$actual_commit" = "$LOCKED_COMMIT" || {
  echo "KWeaver Core must be checked out at $LOCKED_COMMIT; found ${actual_commit:-none}" >&2
  exit 1
}

for migration in \
  "$KWEAVER_CORE_DIR/adp/vega/vega-backend/migrations/mariadb/0.9.0/init.sql" \
  "$KWEAVER_CORE_DIR/adp/bkn/bkn-backend/migrations/mariadb/0.8.0/init.sql"; do
  test -r "$migration" || {
    echo "required migration is not readable: $migration" >&2
    exit 1
  }
done

docker compose -p ceobp-kweaver-p2 -f "$COMPOSE_FILE" config --quiet
echo "KWeaver development preflight passed"
