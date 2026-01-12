# Minecraft CLI Admin

Node.js CLI with interactive TUI dashboard for managing Minecraft servers.

## Installation

```bash
git clone <repo-url>
cd minecraft-cli-admin
./install.sh
```

**Requirements:** Node.js 18+, screen, java

## Usage

```bash
mc-cli dashboard              # Interactive TUI
mc-cli status                 # Show server status
mc-cli start <server>         # Start server
mc-cli stop <server>          # Stop server
mc-cli logs <server>          # Show logs
mc-cli backup <server>        # Create backup
mc-cli --help                 # Full help
```

## TUI Dashboard

Keys: `↑↓` navigate, `s` start, `x` stop, `r` restart, `c` console, `l` logs, `b` backup, `q` quit

## Configuration

File `config.json` (created automatically):

```json
{
  "servers": {
    "survival": {
      "type": "spigot-params",
      "path": "/opt/minecraft/survival",
      "port": 25565
    }
  }
}
```

## Tab Completion

```bash
# Bash - add to ~/.bashrc:
eval "$(mc-cli completion bash)"

# Zsh - add to ~/.zshrc:
eval "$(mc-cli completion zsh)"
```

Then restart your shell or run `source ~/.bashrc` (or `~/.zshrc`).

## Uninstall

```bash
./uninstall.sh
```
