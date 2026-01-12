import chalk from 'chalk';
import { serverService } from '../services/index.js';

interface StartOptions {
  attach?: boolean;
}

export async function startCommand(serverName: string, options: StartOptions): Promise<void> {
  const attach = options.attach !== false;

  console.log(chalk.blue(`Starting server ${serverName}...`));

  const result = await serverService.start(serverName, attach);

  if (result.success) {
    console.log(chalk.green(result.message));
  } else {
    console.log(chalk.red(`Error: ${result.message}`));
    process.exit(1);
  }
}
