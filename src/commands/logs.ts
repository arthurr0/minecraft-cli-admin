import { readFile, access } from 'fs/promises';
import { constants } from 'fs';
import chalk from 'chalk';
import { configService } from '../services/index.js';
import { getLatestLogPath } from '../utils/paths.js';

export async function logsCommand(serverName: string, lines: string = '50'): Promise<void> {
  const hasServer = await configService.hasServer(serverName);
  if (!hasServer) {
    console.log(chalk.red(`Error: Server '${serverName}' does not exist`));
    process.exit(1);
  }

  const serverConfig = await configService.getServer(serverName);
  const logPath = getLatestLogPath(serverConfig.path);

  try {
    await access(logPath, constants.F_OK);
  } catch {
    console.log(chalk.yellow(`No log file found for server ${serverName}`));
    return;
  }

  const content = await readFile(logPath, 'utf-8');
  const allLines = content.split('\n');
  const numLines = parseInt(lines, 10) || 50;
  const lastLines = allLines.slice(-numLines);

  console.log(chalk.bold(`Last ${numLines} lines of ${serverName} logs:`));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(lastLines.join('\n'));
}
