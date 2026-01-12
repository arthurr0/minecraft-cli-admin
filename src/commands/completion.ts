import { configService } from '../services/index.js';

const COMMANDS = [
  'start',
  'stop',
  'restart',
  'status',
  'logs',
  'console',
  'backup',
  'restore',
  'list',
  'cleanup',
  'dashboard',
  'completion',
  'help'
];

export async function completionCommand(shell?: string): Promise<void> {
  const detectedShell = shell || process.env.SHELL?.split('/').pop() || 'bash';

  if (detectedShell === 'bash') {
    console.log(generateBashCompletion());
  } else if (detectedShell === 'zsh') {
    console.log(generateZshCompletion());
  } else {
    console.log(generateBashCompletion());
  }
}

export async function getServerNames(): Promise<string[]> {
  try {
    return await configService.getServerNames();
  } catch {
    return [];
  }
}

function generateBashCompletion(): string {
  return `# mc-cli bash completion
# Add to ~/.bashrc: eval "$(mc-cli completion bash)"

_mc_cli_completions() {
    local cur prev commands servers
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    commands="start stop restart status logs console backup restore list cleanup dashboard completion help"

    case "\${prev}" in
        mc-cli)
            COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
            return 0
            ;;
        start|stop|restart|logs|console|backup|list|cleanup)
            servers=$(mc-cli --list-servers 2>/dev/null || echo "")
            COMPREPLY=( $(compgen -W "\${servers}" -- "\${cur}") )
            return 0
            ;;
        restore)
            servers=$(mc-cli --list-servers 2>/dev/null || echo "")
            COMPREPLY=( $(compgen -W "\${servers}" -- "\${cur}") )
            return 0
            ;;
        completion)
            COMPREPLY=( $(compgen -W "bash zsh" -- "\${cur}") )
            return 0
            ;;
    esac

    COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
}

complete -F _mc_cli_completions mc-cli
`;
}

function generateZshCompletion(): string {
  return `# mc-cli zsh completion
# Add to ~/.zshrc: eval "$(mc-cli completion zsh)"

_mc_cli() {
    local -a commands servers

    commands=(
        'start:Start a Minecraft server'
        'stop:Stop a Minecraft server'
        'restart:Restart a Minecraft server'
        'status:Show status of all servers'
        'logs:Show server logs'
        'console:Attach to server console'
        'backup:Create server backup'
        'restore:Restore from backup'
        'list:List available backups'
        'cleanup:Remove old backups'
        'dashboard:Open interactive TUI'
        'completion:Generate shell completion'
        'help:Show help'
    )

    _arguments -C \\
        '1: :->command' \\
        '2: :->server' \\
        '*: :->args'

    case "\$state" in
        command)
            _describe -t commands 'mc-cli commands' commands
            ;;
        server)
            case "\${words[2]}" in
                start|stop|restart|logs|console|backup|restore|list|cleanup)
                    servers=(\${(f)"$(mc-cli --list-servers 2>/dev/null)"})
                    _describe -t servers 'servers' servers
                    ;;
                completion)
                    _values 'shell' bash zsh
                    ;;
            esac
            ;;
    esac
}

compdef _mc_cli mc-cli
`;
}
