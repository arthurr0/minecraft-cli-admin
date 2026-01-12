#!/usr/bin/env bash

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[*]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }

INSTALL_DIR="${MC_INSTALL_DIR:-$HOME/.local/bin}"
SYMLINK_PATH="$INSTALL_DIR/mc-cli"

echo ""
echo -e "${RED}Uninstalling mc-cli${NC}"
echo ""

if [ -L "$SYMLINK_PATH" ]; then
    log "Removing symlink: $SYMLINK_PATH"
    rm -f "$SYMLINK_PATH"
    success "Symlink removed"
else
    log "Symlink does not exist: $SYMLINK_PATH"
fi

echo ""
echo "To completely remove, delete the project directory:"
echo -e "  ${RED}rm -rf $(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)${NC}"
echo ""
