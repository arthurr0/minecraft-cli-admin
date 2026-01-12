import chalk from 'chalk';
import { serverService } from '../services/index.js';

export async function statusCommand(): Promise<void> {
  console.log(chalk.bold('Minecraft servers status:'));
  console.log(chalk.gray('─'.repeat(60)));

  const servers = await serverService.getAllStatus();

  if (servers.length === 0) {
    console.log(chalk.yellow('No servers configured.'));
    return;
  }

  for (const server of servers) {
    const typeLabel = server.config.type === 'proxy-params'
      ? chalk.cyan('(Velocity proxy)')
      : chalk.gray(`(Port: ${server.config.port})`);

    const statusLabel = server.status === 'running'
      ? chalk.green('RUNNING')
      : chalk.red('STOPPED');

    let details = '';
    if (server.status === 'running') {
      const parts = [];
      if (server.pid) parts.push(`PID: ${server.pid}`);
      if (server.uptime) parts.push(`Uptime: ${server.uptime}`);
      if (server.memoryMB) parts.push(`RAM: ${server.memoryMB}MB`);
      details = chalk.gray(` (${parts.join(', ')})`);
    } else if (server.config.port && server.portInUse) {
      details = chalk.yellow(` (Port ${server.config.port} is busy!)`);
    }

    console.log(`${chalk.bold(server.name)} ${typeLabel}: ${statusLabel}${details}`);
  }
}
