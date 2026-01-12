import { shell } from '../utils/shell.js';

export class ScreenService {
  async exists(sessionName: string): Promise<boolean> {
    const result = await shell('screen', ['-list']);
    return result.stdout.includes(sessionName);
  }

  async create(sessionName: string, workingDir: string, command: string[]): Promise<boolean> {
    const fullCommand = command.join(' ');
    const result = await shell('screen', [
      '-dmS', sessionName,
      '-c', '/dev/null',
      'bash', '-c', `cd "${workingDir}" && ${fullCommand}`
    ]);
    return result.success;
  }

  async send(sessionName: string, command: string): Promise<boolean> {
    const result = await shell('screen', [
      '-S', sessionName,
      '-X', 'stuff',
      `${command}\r`
    ]);
    return result.success;
  }

  async attach(sessionName: string): Promise<void> {
    const { spawn } = await import('child_process');
    const screen = spawn('screen', ['-x', sessionName], {
      stdio: 'inherit'
    });

    await new Promise<void>((resolve, reject) => {
      screen.on('close', () => resolve());
      screen.on('error', reject);
    });
  }

  async getPid(sessionName: string): Promise<number | null> {
    const result = await shell('screen', ['-list']);
    if (!result.success) return null;

    const lines = result.stdout.split('\n');
    for (const line of lines) {
      if (line.includes(sessionName)) {
        const match = line.match(/^\s*(\d+)\./);
        if (match) {
          return parseInt(match[1], 10);
        }
      }
    }
    return null;
  }

  async kill(sessionName: string): Promise<boolean> {
    const result = await shell('screen', ['-S', sessionName, '-X', 'quit']);
    return result.success;
  }

  async list(): Promise<string[]> {
    const result = await shell('screen', ['-list']);
    if (!result.success) return [];

    const sessions: string[] = [];
    const lines = result.stdout.split('\n');

    for (const line of lines) {
      const match = line.match(/^\s*\d+\.([^\s]+)/);
      if (match) {
        sessions.push(match[1]);
      }
    }

    return sessions;
  }

  async wipe(): Promise<void> {
    await shell('screen', ['-wipe']);
  }
}

export const screenService = new ScreenService();
