import chalk from 'chalk';
import { backupService } from '../services/index.js';

export async function cleanupCommand(serverName?: string, days: string = '30'): Promise<void> {
  const daysToKeep = parseInt(days, 10) || 30;

  console.log(chalk.blue(`Cleaning up backups older than ${daysToKeep} days...`));

  const deletedCount = await backupService.cleanupOldBackups(serverName, daysToKeep);

  if (deletedCount > 0) {
    console.log(chalk.green(`Deleted ${deletedCount} old backup(s)`));
  } else {
    console.log(chalk.yellow('No old backups to delete'));
  }
}
