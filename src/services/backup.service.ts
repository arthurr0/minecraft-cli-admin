import { readdir, stat, mkdir, rm, access } from 'fs/promises';
import { constants } from 'fs';
import { join, basename, dirname } from 'path';
import { execa } from 'execa';
import { configService, ConfigService } from './config.service.js';
import { serverService, ServerService } from './server.service.js';
import { screenService, ScreenService } from './screen.service.js';
import { compressionService, CompressionService } from './compression.service.js';
import { getBackupPath } from '../utils/paths.js';
import type { BackupInfo, BackupResult, CompressionType } from '../types/backup.js';

export class BackupService {
  private backupDir: string;

  constructor(
    private config: ConfigService = configService,
    private server: ServerService = serverService,
    private screen: ScreenService = screenService,
    private compression: CompressionService = compressionService,
    backupDir?: string
  ) {
    this.backupDir = backupDir || getBackupPath();
  }

  async createBackup(serverName: string): Promise<BackupResult> {
    const hasServer = await this.config.hasServer(serverName);
    if (!hasServer) {
      return { success: false, error: `Server '${serverName}' does not exist` };
    }

    const serverConfig = await this.config.getServer(serverName);
    const compressionInfo = await this.compression.detectBest();

    await mkdir(this.backupDir, { recursive: true });

    const isRunning = await this.screen.exists(serverName);
    let saveWasOff = false;

    if (isRunning) {
      await this.screen.send(serverName, 'save-all');
      await this.sleep(5000);
      await this.screen.send(serverName, 'save-all');
      await this.sleep(3000);
      await this.screen.send(serverName, 'save-off');
      saveWasOff = true;
      await this.sleep(15000);
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupName = `${serverName}_backup_${timestamp}${compressionInfo.extension}`;
      const backupPath = join(this.backupDir, backupName);

      const parentDir = dirname(serverConfig.path);
      const serverDirName = basename(serverConfig.path);

      await execa('tar', [
        compressionInfo.tarOptions,
        '--exclude=*.log',
        '--exclude=logs/latest.log',
        '--exclude=crash-reports',
        '-cf',
        backupPath,
        serverDirName
      ], { cwd: parentDir });

      const stats = await stat(backupPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      return {
        success: true,
        path: backupPath,
        size: `${sizeMB} MB`
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    } finally {
      if (saveWasOff && await this.screen.exists(serverName)) {
        await this.screen.send(serverName, 'save-on');
      }
    }
  }

  async restoreBackup(serverName: string, backupFile: string, force: boolean = false): Promise<BackupResult> {
    const hasServer = await this.config.hasServer(serverName);
    if (!hasServer) {
      return { success: false, error: `Server '${serverName}' does not exist` };
    }

    let backupPath = backupFile;
    try {
      await access(backupPath, constants.F_OK);
    } catch {
      backupPath = join(this.backupDir, backupFile);
      try {
        await access(backupPath, constants.F_OK);
      } catch {
        return { success: false, error: `Backup file '${backupFile}' not found` };
      }
    }

    const compressionInfo = this.compression.getInfoFromExtension(backupPath);
    if (!compressionInfo) {
      return { success: false, error: 'Unknown backup format' };
    }

    const isRunning = await this.screen.exists(serverName);
    if (isRunning) {
      if (!force) {
        return { success: false, error: `Server ${serverName} is running. Stop it first or use --force` };
      }
      const stopResult = await this.server.stop(serverName, true);
      if (!stopResult.success) {
        return { success: false, error: `Failed to stop server: ${stopResult.message}` };
      }
      await this.sleep(3000);
    }

    const serverConfig = await this.config.getServer(serverName);
    const parentDir = dirname(serverConfig.path);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const emergencyBackupPath = join(this.backupDir, `${serverName}_before_restore_${timestamp}.tar.gz`);

    try {
      await access(serverConfig.path, constants.F_OK);
      const serverDirName = basename(serverConfig.path);

      await execa('tar', ['-czf', emergencyBackupPath, serverDirName], { cwd: parentDir });
      await rm(serverConfig.path, { recursive: true, force: true });
    } catch {
    }

    try {
      await mkdir(parentDir, { recursive: true });

      await execa('tar', [compressionInfo.tarOptions, '-xf', backupPath], { cwd: parentDir });

      return { success: true, path: serverConfig.path };
    } catch (error) {
      try {
        await access(emergencyBackupPath, constants.F_OK);
        await execa('tar', ['-xzf', emergencyBackupPath], { cwd: parentDir });
      } catch {
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Restore failed: ${message}` };
    }
  }

  async listBackups(serverName?: string): Promise<BackupInfo[]> {
    try {
      await access(this.backupDir, constants.F_OK);
    } catch {
      return [];
    }

    const files = await readdir(this.backupDir);
    const backups: BackupInfo[] = [];

    for (const file of files) {
      if (!file.includes('_backup_')) continue;
      if (serverName && !file.startsWith(`${serverName}_backup_`)) continue;

      const compressionInfo = this.compression.getInfoFromExtension(file);
      if (!compressionInfo) continue;

      const filePath = join(this.backupDir, file);
      const stats = await stat(filePath);

      const match = file.match(/^(.+?)_backup_(.+?)\./);
      const server = match ? match[1] : 'unknown';

      backups.push({
        filename: file,
        serverName: server,
        path: filePath,
        size: this.formatSize(stats.size),
        sizeBytes: stats.size,
        createdAt: stats.mtime,
        compression: compressionInfo.type
      });
    }

    return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async cleanupOldBackups(serverName?: string, daysToKeep: number = 30): Promise<number> {
    const backups = await this.listBackups(serverName);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let deletedCount = 0;

    for (const backup of backups) {
      if (backup.createdAt < cutoffDate) {
        try {
          await rm(backup.path);
          deletedCount++;
        } catch {
        }
      }
    }

    return deletedCount;
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const backupService = new BackupService();
