import { execa } from 'execa';
import { commandExists } from '../utils/shell.js';
import { backupService, BackupService } from './backup.service.js';
import type { BackupResult } from '../types/backup.js';

export type S3Tool = 's3cmd' | 'rclone';

export class S3Service {
  constructor(private backup: BackupService = backupService) {}

  async detectTool(): Promise<S3Tool | null> {
    if (await commandExists('s3cmd')) return 's3cmd';
    if (await commandExists('rclone')) return 'rclone';
    return null;
  }

  async uploadBackup(
    serverName: string,
    bucket: string,
    s3Path: string = 'backups'
  ): Promise<BackupResult> {
    const tool = await this.detectTool();
    if (!tool) {
      return { success: false, error: 'No S3 tool available. Install s3cmd or rclone.' };
    }

    const backupResult = await this.backup.createBackup(serverName);
    if (!backupResult.success || !backupResult.path) {
      return backupResult;
    }

    const filename = backupResult.path.split('/').pop()!;
    const s3Destination = `s3://${bucket}/${s3Path}/${filename}`;

    try {
      if (tool === 's3cmd') {
        await execa('s3cmd', ['put', backupResult.path, s3Destination]);
      } else {
        await execa('rclone', ['copy', backupResult.path, `s3:${bucket}/${s3Path}/`]);
      }

      return {
        success: true,
        path: s3Destination,
        size: backupResult.size
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `S3 upload failed: ${message}` };
    }
  }
}

export const s3Service = new S3Service();
