#!/usr/bin/env bash
set -euo pipefail

SUBDOMAIN="${NHOST_SUBDOMAIN:-knnxqdyuwqvdrupkbvgr}"
REF="${1:-HEAD}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -z "${NHOST_PAT:-}" ]]; then
  echo "NHOST_PAT is required."
  echo "Create one at https://app.nhost.io/account/tokens"
  exit 1
fi

CLI_DIR="$ROOT/.tmp-nhost"
CLI_BIN="$CLI_DIR/nhost"

if [[ ! -x "$CLI_BIN" ]]; then
  mkdir -p "$CLI_DIR"
  ARCH="$(uname -m)"
  case "$ARCH" in
    x86_64|amd64) ASSET="cli-1.49.0-linux-amd64.tar.gz" ;;
    aarch64|arm64) ASSET="cli-1.49.0-linux-arm64.tar.gz" ;;
    *)
      echo "Unsupported architecture: $ARCH"
      exit 1
      ;;
  esac
  curl -fsSL -o "$CLI_DIR/cli.tar.gz" \
    "https://github.com/nhost/nhost/releases/download/cli%401.49.0/$ASSET"
  tar -xzf "$CLI_DIR/cli.tar.gz" -C "$CLI_DIR"
  mv "$CLI_DIR/cli" "$CLI_BIN"
  chmod +x "$CLI_BIN"
fi

cd "$ROOT"
"$CLI_BIN" login --pat "$NHOST_PAT"
"$CLI_BIN" deployments new \
  --subdomain "$SUBDOMAIN" \
  --ref "$REF" \
  --message "Deploy migrations and metadata from local script" \
  --follow

echo "Verifying GraphQL schema..."
npm run verify:graphql
