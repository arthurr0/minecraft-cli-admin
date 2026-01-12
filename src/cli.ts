import { Command } from 'commander';
import {
  startCommand,
  stopCommand,
  restartCommand,
  statusCommand,
  logsCommand,
  consoleCommand,
  backupCommand,
  restoreCommand,
  listCommand,
  cleanupCommand,
  completionCommand
} from './commands/index.js';
import { configService } from './services/index.js';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('mc-cli')
    .description('Minecraft server management CLI with TUI dashboard')
    .version('1.0.0');

  program
    .option('--list-servers', 'List server names (for shell completion)')
    .action(async (options) => {
      if (options.listServers) {
        try {
          const servers = await configService.getServerNames();
          console.log(servers.join('\n'));
        } catch {
          // Silent fail for completion
        }
        process.exit(0);
      }
    });

  program
    .command('start <server>')
    .description('Start a Minecraft server')
    .option('--no-attach', 'Do not attach to console after start')
    .action(startCommand);

  program
    .command('stop <server>')
    .description('Stop a Minecraft server')
    .option('--force', 'Force kill without graceful shutdown')
    .action(stopCommand);

  program
    .command('restart <server>')
    .description('Restart a Minecraft server')
    .action(restartCommand);

  program
    .command('status')
    .description('Show status of all servers')
    .action(statusCommand);

  program
    .command('logs <server> [lines]')
    .description('Show last n lines of server logs (default: 50)')
    .action(logsCommand);

  program
    .command('console <server>')
    .description('Attach to running server console')
    .action(consoleCommand);

  program
    .command('backup <server>')
    .description('Create server backup')
    .option('--s3 <bucket>', 'Upload to S3 bucket')
    .option('--path <path>', 'S3 path prefix', 'backups')
    .action(backupCommand);

  program
    .command('restore <server> <file>')
    .description('Restore server from backup')
    .option('--force', 'Stop server if running before restore')
    .action(restoreCommand);

  program
    .command('list [server]')
    .description('List available backups')
    .action(listCommand);

  program
    .command('cleanup [server] [days]')
    .description('Remove backups older than n days (default: 30)')
    .action(cleanupCommand);

  program
    .command('dashboard')
    .alias('ui')
    .description('Open interactive TUI dashboard')
    .action(async () => {
      const { renderDashboard } = await import('./ui/App.js');
      renderDashboard();
    });

  program
    .command('completion [shell]')
    .description('Generate shell completion script (bash/zsh)')
    .action(completionCommand);

  return program;
}
