import chalk from 'chalk';
import { backupService, s3Service } from '../services/index.js';

interface BackupOptions {
  s3?: string;
  path?: string;
}

export async function backupCommand(serverName: string, options: BackupOptions): Promise<void> {
  console.log(chalk.blue(`Creating backup for ${serverName}...`));

  if (options.s3) {
    const s3Path = options.path || 'backups';
    const result = await s3Service.uploadBackup(serverName, options.s3, s3Path);

    if (result.success) {
      console.log(chalk.green('Backup uploaded to S3 successfully'));
      console.log(chalk.gray(`Location: ${result.path}`));
      console.log(chalk.gray(`Size: ${result.size}`));
    } else {
      console.log(chalk.red(`Error: ${result.error}`));
      process.exit(1);
    }
  } else {
    const result = await backupService.createBackup(serverName);

    if (result.success) {
      console.log(chalk.green('Backup created successfully'));
      console.log(chalk.gray(`File: ${result.path}`));
      console.log(chalk.gray(`Size: ${result.size}`));
    } else {
      console.log(chalk.red(`Error: ${result.error}`));
      process.exit(1);
    }
  }
}
