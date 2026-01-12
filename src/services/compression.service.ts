import { commandExists } from '../utils/shell.js';
import type { CompressionType } from '../types/backup.js';

export interface CompressionInfo {
  type: CompressionType;
  extension: string;
  tarOptions: string;
}

const COMPRESSION_PRIORITY: CompressionInfo[] = [
  { type: 'zstd', extension: '.tar.zst', tarOptions: '--zstd' },
  { type: 'xz', extension: '.tar.xz', tarOptions: '-J' },
  { type: 'gzip', extension: '.tar.gz', tarOptions: '-z' }
];

export class CompressionService {
  private availableCompression: CompressionInfo | null = null;

  async detectBest(): Promise<CompressionInfo> {
    if (this.availableCompression) {
      return this.availableCompression;
    }

    for (const compression of COMPRESSION_PRIORITY) {
      const exists = await commandExists(compression.type);
      if (exists) {
        this.availableCompression = compression;
        return compression;
      }
    }

    throw new Error('No compression tool available. Install zstd, xz, or gzip.');
  }

  getInfoFromExtension(filename: string): CompressionInfo | null {
    for (const compression of COMPRESSION_PRIORITY) {
      if (filename.endsWith(compression.extension)) {
        return compression;
      }
    }
    return null;
  }

  async isAvailable(type: CompressionType): Promise<boolean> {
    return commandExists(type);
  }
}

export const compressionService = new CompressionService();
