export type CompressionType = 'zstd' | 'xz' | 'gzip';

export interface BackupInfo {
  filename: string;
  serverName: string;
  path: string;
  size: string;
  sizeBytes: number;
  createdAt: Date;
  compression: CompressionType;
}

export interface BackupResult {
  success: boolean;
  path?: string;
  size?: string;
  error?: string;
}

export interface BackupProgress {
  current: number;
  total: number;
  percent: number;
  stage: 'preparing' | 'archiving' | 'compressing' | 'uploading' | 'done';
}
