#!/usr/bin/env bash
set -euo pipefail

REPO="arthurr0/minecraft-cli-admin"
INSTALL_DIR="${MC_INSTALL_DIR:-}"
VERSION="${1:-${MC_VERSION:-latest}}"

need_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

resolve_version() {
  if [[ "$VERSION" != "latest" ]]; then
    echo "${VERSION#v}"
    return
  fi

  curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
    | grep '"tag_name"' \
    | head -n 1 \
    | sed -E 's/.*"v?([^"]+)".*/\1/'
}

main() {
  need_command curl
  need_command npm
  need_command mktemp

  local resolved_version
  resolved_version="$(resolve_version)"

  if [[ -z "$resolved_version" ]]; then
    echo "Failed to resolve release version" >&2
    exit 1
  fi

  local tarball="minecraft-cli-admin-${resolved_version}.tgz"
  local download_url="https://github.com/${REPO}/releases/download/v${resolved_version}/${tarball}"
  local tmpdir
  tmpdir="$(mktemp -d)"
  trap 'rm -rf "$tmpdir"' EXIT

  echo "Downloading ${download_url}"
  curl -fsSL "$download_url" -o "${tmpdir}/${tarball}"

  echo "Installing ${tarball}"
  if [[ -n "$INSTALL_DIR" ]]; then
    npm install -g --prefix "$INSTALL_DIR" "${tmpdir}/${tarball}"
    echo "Installed under ${INSTALL_DIR}"
  else
    npm install -g "${tmpdir}/${tarball}"
  fi

  echo "Installed mc-cli ${resolved_version}"
  echo "Verify with: mc-cli --version"
}

main "$@"
