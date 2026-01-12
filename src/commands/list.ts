import chalk from 'chalk';
import { backupService } from '../services/index.js';

export async function listCommand(serverName?: string): Promise<void> {
  const backups = await backupService.listBackups(serverName);

  if (backups.length === 0) {
    const msg = serverName
      ? `No backups found for ${serverName}`
      : 'No backups found';
    console.log(chalk.yellow(msg));
    return;
  }

  const title = serverName
    ? `Backups for ${serverName}:`
    : 'All backups:';

  console.log(chalk.bold(title));
  console.log(chalk.gray('─'.repeat(80)));

  const header = [
    'Filename'.padEnd(50),
    'Size'.padEnd(12),
    'Date'.padEnd(20)
  ].join(' ');
  console.log(chalk.gray(header));
  console.log(chalk.gray('─'.repeat(80)));

  for (const backup of backups) {
    const date = backup.createdAt.toLocaleString();
    const row = [
      backup.filename.padEnd(50),
      backup.size.padEnd(12),
      date.padEnd(20)
    ].join(' ');
    console.log(row);
  }

  console.log(chalk.gray('─'.repeat(80)));
  console.log(chalk.gray(`Total: ${backups.length} backup(s)`));
}
