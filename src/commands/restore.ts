import chalk from 'chalk';
import { backupService } from '../services/index.js';

interface RestoreOptions {
  force?: boolean;
}

export async function restoreCommand(
  serverName: string,
  backupFile: string,
  options: RestoreOptions
): Promise<void> {
  const force = options.force === true;

  console.log(chalk.blue(`Restoring ${serverName} from ${backupFile}...`));

  const result = await backupService.restoreBackup(serverName, backupFile, force);

  if (result.success) {
    console.log(chalk.green('Backup restored successfully'));
    console.log(chalk.gray(`Server path: ${result.path}`));
    console.log(chalk.yellow(`You can now start the server: mc-cli start ${serverName}`));
  } else {
    console.log(chalk.red(`Error: ${result.error}`));
    process.exit(1);
  }
}
