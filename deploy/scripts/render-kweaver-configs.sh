#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-$(pwd)}"
TEMPLATE_DIR="$PROJECT_DIR/deploy/kweaver/config"
RUNTIME_DIR="${CEO_BP_KWEAVER_RUNTIME_DIR:-$PROJECT_DIR/.runtime/kweaver}"
CONFIG_DIR="$RUNTIME_DIR/config"
DB_PASSWORD="${CEO_BP_KWEAVER_DB_PASSWORD:-}"

test -n "$DB_PASSWORD" || {
  echo "CEO_BP_KWEAVER_DB_PASSWORD is required" >&2
  exit 1
}
case "$DB_PASSWORD" in
  *[!A-Za-z0-9_.-]* | "")
    echo "database password must use only letters, digits, dot, underscore, or hyphen" >&2
    exit 1
    ;;
esac
test "${#DB_PASSWORD}" -ge 16 || {
  echo "database password must contain at least 16 characters" >&2
  exit 1
}

umask 077
mkdir -p "$CONFIG_DIR"

render_template() {
  local template_name="$1"
  local output_name="${template_name%.tpl}"
  local template_path="$TEMPLATE_DIR/$template_name"
  local output_path="$CONFIG_DIR/$output_name"
  local temporary_path

  test -r "$template_path" || {
    echo "configuration template is not readable: $template_path" >&2
    exit 1
  }
  temporary_path="$(mktemp "$CONFIG_DIR/.${output_name}.XXXXXX")"
  sed "s/__DB_PASSWORD_JSON__/\"$DB_PASSWORD\"/g" "$template_path" >"$temporary_path"
  if grep -q '__[A-Z0-9_]*__' "$temporary_path"; then
    echo "unresolved configuration placeholder in $template_name" >&2
    exit 1
  fi
  chmod 600 "$temporary_path"
  mv "$temporary_path" "$output_path"
}

render_template bkn-backend-config.yaml.tpl
render_template ontology-query-config.yaml.tpl
render_template vega-backend-config.yaml.tpl

echo "rendered KWeaver configuration in $CONFIG_DIR"
