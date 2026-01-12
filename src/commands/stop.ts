import chalk from 'chalk';
import { serverService } from '../services/index.js';

interface StopOptions {
  force?: boolean;
}

export async function stopCommand(serverName: string, options: StopOptions): Promise<void> {
  const force = options.force === true;

  console.log(chalk.blue(`Stopping server ${serverName}...`));

  const result = await serverService.stop(serverName, force);

  if (result.success) {
    console.log(chalk.green(result.message));
  } else {
    console.log(chalk.red(`Error: ${result.message}`));
    process.exit(1);
  }
}
