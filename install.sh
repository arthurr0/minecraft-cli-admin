#!/usr/bin/env bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[*]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${MC_INSTALL_DIR:-$HOME/.local/bin}"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}    Minecraft CLI Admin - Installer       ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

log "Checking required tools..."

check_command() {
    if command -v "$1" &>/dev/null; then
        success "$1 - installed"
        return 0
    else
        warn "$1 - MISSING"
        return 1
    fi
}

MISSING=()

check_command "node" || MISSING+=("nodejs")
check_command "npm" || MISSING+=("npm")
check_command "screen" || MISSING+=("screen")
check_command "java" || MISSING+=("openjdk-17-jre-headless")

if command -v node &>/dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js must be version 18+. Current: $(node -v)"
    fi
fi

echo ""
log "Checking optional tools (backup/compression)..."
check_command "zstd" || warn "zstd - recommended for backup compression"
check_command "netstat" || check_command "ss" || warn "netstat/ss - for port checking"

if [ ${#MISSING[@]} -gt 0 ]; then
    echo ""
    warn "Missing required tools: ${MISSING[*]}"
    echo ""
    echo "Install them with:"
    echo -e "${YELLOW}  sudo apt update && sudo apt install ${MISSING[*]}${NC}"
    echo ""
    read -p "Continue anyway? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
log "Installing npm dependencies..."
cd "$SCRIPT_DIR"
npm install --silent

log "Building project..."
npm run build --silent
success "Project built"

mkdir -p "$INSTALL_DIR"

SYMLINK_PATH="$INSTALL_DIR/mc-cli"
if [ -L "$SYMLINK_PATH" ] || [ -e "$SYMLINK_PATH" ]; then
    log "Removing old symlink..."
    rm -f "$SYMLINK_PATH"
fi

ln -s "$SCRIPT_DIR/bin/mc-cli" "$SYMLINK_PATH"
success "Created symlink: $SYMLINK_PATH"

if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo ""
    warn "$INSTALL_DIR is not in PATH"
    echo ""

    SHELL_CONFIG=""
    if [ -n "$ZSH_VERSION" ] || [ "$SHELL" = "/bin/zsh" ]; then
        SHELL_CONFIG="$HOME/.zshrc"
    elif [ -n "$BASH_VERSION" ] || [ "$SHELL" = "/bin/bash" ]; then
        SHELL_CONFIG="$HOME/.bashrc"
    fi

    if [ -n "$SHELL_CONFIG" ]; then
        read -p "Add $INSTALL_DIR to PATH in $SHELL_CONFIG? [Y/n] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            echo "" >> "$SHELL_CONFIG"
            echo "# Minecraft CLI Admin" >> "$SHELL_CONFIG"
            echo "export PATH=\"$INSTALL_DIR:\$PATH\"" >> "$SHELL_CONFIG"
            success "Added PATH to $SHELL_CONFIG"
        fi

        read -p "Enable tab completion in $SHELL_CONFIG? [Y/n] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            local shell_name=$(basename "$SHELL")
            echo "eval \"\$(mc-cli completion $shell_name)\"" >> "$SHELL_CONFIG"
            success "Added tab completion to $SHELL_CONFIG"
        fi

        warn "Run: source $SHELL_CONFIG"
    else
        echo "Add manually to your shell config:"
        echo -e "${YELLOW}  export PATH=\"$INSTALL_DIR:\$PATH\"${NC}"
    fi
fi

echo ""
log "Testing installation..."
if "$SYMLINK_PATH" --version &>/dev/null; then
    VERSION=$("$SYMLINK_PATH" --version)
    success "mc-cli v$VERSION installed successfully!"
else
    error "Installation failed"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}       Installation complete!             ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo "Usage:"
echo -e "  ${BLUE}mc-cli dashboard${NC}     - Interactive TUI"
echo -e "  ${BLUE}mc-cli status${NC}        - Server status"
echo -e "  ${BLUE}mc-cli start <srv>${NC}   - Start server"
echo -e "  ${BLUE}mc-cli --help${NC}        - Help"
echo ""
echo "Config: ${SCRIPT_DIR}/config.json"
echo ""
