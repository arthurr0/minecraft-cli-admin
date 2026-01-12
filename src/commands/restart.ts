import chalk from 'chalk';
import { serverService } from '../services/index.js';

export async function restartCommand(serverName: string): Promise<void> {
  console.log(chalk.blue(`Restarting server ${serverName}...`));

  const result = await serverService.restart(serverName);

  if (result.success) {
    console.log(chalk.green(result.message));
  } else {
    console.log(chalk.red(`Error: ${result.message}`));
    process.exit(1);
  }
}
