#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[install] npm registry: $(npm config get registry)"

run_install() {
  local mode="$1"
  echo "[install] mode=${mode}"
  npm install --no-audit --no-fund
}

if run_install "default"; then
  echo "[install] success in default mode"
  exit 0
fi

echo "[install] default mode failed, retrying without proxy env ..."
if timeout 45s env -u http_proxy -u https_proxy -u HTTP_PROXY -u HTTPS_PROXY -u npm_config_http_proxy -u npm_config_https_proxy npm install --no-audit --no-fund; then
  echo "[install] success in direct mode"
  exit 0
fi

cat <<'MSG'
[install] failed in both modes.
Possible causes in Codex/container environments:
1) outbound registry access blocked by policy (403)
2) proxy is required but credentials are missing
3) direct network is blocked so no-proxy retry hangs/fails

Try:
- export npm_config_registry=https://registry.npmjs.org
- ensure proxy auth is correctly configured (if your environment requires it)
- run this script again: bash scripts/install-deps.sh
MSG

exit 1
