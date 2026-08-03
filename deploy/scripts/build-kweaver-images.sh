#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-$(pwd)}"
DOCKERFILE="$PROJECT_DIR/components/kweaver/docker/Dockerfile.service"
PATCH_DIR="$PROJECT_DIR/components/kweaver/patches"
LOCKED_COMMIT="b9b35fb245c31660127114c883e91165b42dc8f0"
IMAGE_VERSION="${CEO_BP_KWEAVER_IMAGE_VERSION:-0.5.0-p2}"

test -n "${KWEAVER_CORE_DIR:-}" || {
  echo "KWEAVER_CORE_DIR is required" >&2
  exit 1
}
test -f "$DOCKERFILE" || {
  echo "service Dockerfile not found: $DOCKERFILE" >&2
  exit 1
}

actual_commit="$(git -C "$KWEAVER_CORE_DIR" rev-parse HEAD 2>/dev/null || true)"
test "$actual_commit" = "$LOCKED_COMMIT" || {
  echo "KWeaver Core must be checked out at $LOCKED_COMMIT; found ${actual_commit:-none}" >&2
  exit 1
}

build_service() {
  local image_name="$1"
  local source_path="$2"
  local binary_name="$3"
  local version_package="$4"
  local service_port="$5"
  local patch_file="$6"

  echo "building ceobp/${image_name}:${IMAGE_VERSION} from locked KWeaver Core"
  docker build \
    --file "$DOCKERFILE" \
    --tag "ceobp/${image_name}:${IMAGE_VERSION}" \
    --build-context "ceobp_patches=${PATCH_DIR}" \
    --build-arg "BINARY_NAME=${binary_name}" \
    --build-arg "PATCH_FILE=${patch_file}" \
    --build-arg "SERVICE_VERSION=${IMAGE_VERSION}" \
    --build-arg "VERSION_PACKAGE=${version_package}" \
    --build-arg "SERVICE_PORT=${service_port}" \
    "$KWEAVER_CORE_DIR/$source_path"
}

build_service \
  kweaver-vega \
  adp/vega/vega-backend/server \
  vega-backend-server \
  vega-backend/version \
  13014 \
  vega-allow-keyword-on-text.patch

build_service \
  kweaver-bkn \
  adp/bkn/bkn-backend/server \
  bkn-backend-server \
  bkn-backend/version \
  13014 \
  bkn-unique-concept-schema.patch

build_service \
  kweaver-ontology-query \
  adp/bkn/ontology-query/server \
  ontology-query-server \
  ontology-query/version \
  13018 \
  ""

docker image inspect \
  "ceobp/kweaver-vega:${IMAGE_VERSION}" \
  "ceobp/kweaver-bkn:${IMAGE_VERSION}" \
  "ceobp/kweaver-ontology-query:${IMAGE_VERSION}" \
  --format '{{.RepoTags}} {{.Id}} {{.Size}}'
