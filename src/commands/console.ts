import chalk from 'chalk';
import { serverService } from '../services/index.js';

export async function consoleCommand(serverName: string): Promise<void> {
  try {
    console.log(chalk.blue(`Attaching to ${serverName} console...`));
    console.log(chalk.gray('Press Ctrl+A, D to detach'));
    await serverService.attachConsole(serverName);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.log(chalk.red(`Error: ${message}`));
    process.exit(1);
  }
}
