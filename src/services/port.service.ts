import { readFile, writeFile } from 'fs/promises';
import { shell } from '../utils/shell.js';
import { getServerPropertiesPath } from '../utils/paths.js';

export class PortService {
  async isInUse(port: number): Promise<boolean> {
    const result = await shell('netstat', ['-tuln']);
    if (!result.success) {
      const ssResult = await shell('ss', ['-tuln']);
      if (!ssResult.success) return false;
      return ssResult.stdout.includes(`:${port} `);
    }
    return result.stdout.includes(`:${port} `);
  }

  async configureServerProperties(serverPath: string, port: number): Promise<boolean> {
    const propertiesPath = getServerPropertiesPath(serverPath);

    try {
      let content = await readFile(propertiesPath, 'utf-8');

      const portRegex = /^server-port=\d+$/m;
      if (portRegex.test(content)) {
        content = content.replace(portRegex, `server-port=${port}`);
      } else {
        content += `\nserver-port=${port}`;
      }

      await writeFile(propertiesPath, content, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }

  async getPortFromProperties(serverPath: string): Promise<number | null> {
    const propertiesPath = getServerPropertiesPath(serverPath);

    try {
      const content = await readFile(propertiesPath, 'utf-8');
      const match = content.match(/^server-port=(\d+)$/m);
      if (match) {
        return parseInt(match[1], 10);
      }
      return null;
    } catch {
      return null;
    }
  }

  async findAvailablePort(startPort: number = 25565, maxAttempts: number = 100): Promise<number | null> {
    for (let i = 0; i < maxAttempts; i++) {
      const port = startPort + i;
      const inUse = await this.isInUse(port);
      if (!inUse) {
        return port;
      }
    }
    return null;
  }
}

export const portService = new PortService();
