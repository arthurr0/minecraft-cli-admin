import { shell } from '../utils/shell.js';
import type { NetworkStats } from '../types/server.js';

export class ProcessService {
  async isRunning(pid: number): Promise<boolean> {
    const result = await shell('ps', ['-p', String(pid)]);
    return result.success;
  }

  async getUptime(pid: number): Promise<string | null> {
    const result = await shell('ps', ['-p', String(pid), '-o', 'etime=']);
    if (!result.success) return null;
    return result.stdout.trim();
  }

  async getMemoryKB(pid: number): Promise<number | null> {
    const result = await shell('ps', ['-p', String(pid), '-o', 'rss=']);
    if (!result.success) return null;
    const memory = parseInt(result.stdout.trim(), 10);
    return isNaN(memory) ? null : memory;
  }

  async getMemoryMB(pid: number): Promise<number | null> {
    const memoryKB = await this.getMemoryKB(pid);
    if (memoryKB === null) return null;
    return Math.round(memoryKB / 1024);
  }

  async getCpuPercent(pid: number): Promise<number | null> {
    const result = await shell('ps', ['-p', String(pid), '-o', '%cpu=']);
    if (!result.success) return null;

    const cpu = parseFloat(result.stdout.trim().replace(',', '.'));
    return Number.isNaN(cpu) ? null : Number(cpu.toFixed(1));
  }

  async kill(pid: number, signal: 'TERM' | 'KILL' = 'TERM'): Promise<boolean> {
    const sig = signal === 'KILL' ? '-KILL' : '-TERM';
    const result = await shell('kill', [sig, String(pid)]);
    return result.success;
  }

  async getChildPids(parentPid: number): Promise<number[]> {
    const result = await shell('pgrep', ['-P', String(parentPid)]);
    if (!result.success) return [];

    return result.stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => parseInt(line.trim(), 10))
      .filter(pid => !isNaN(pid));
  }

  async getJavaPidByName(procName: string): Promise<number | null> {
    const result = await shell('pgrep', ['-f', `Dproc_name=${procName}`]);
    if (!result.success) return null;

    const pid = parseInt(result.stdout.trim().split('\n')[0], 10);
    return isNaN(pid) ? null : pid;
  }

  async getNetworkStats(pid: number): Promise<NetworkStats | null> {
    const result = await shell('ss', ['-H', '-tupn']);
    if (!result.success) return null;

    let connections = 0;
    let rxBytes = 0;
    let txBytes = 0;

    const lines = result.stdout.split('\n');
    for (const line of lines) {
      if (!line.includes(`pid=${pid},`)) {
        continue;
      }

      connections += 1;

      const rxMatch = line.match(/bytes_received:(\d+)/);
      if (rxMatch) {
        rxBytes += parseInt(rxMatch[1], 10);
      }

      const txMatch = line.match(/bytes_sent:(\d+)/);
      if (txMatch) {
        txBytes += parseInt(txMatch[1], 10);
      }
    }

    return {
      connections,
      rxBytes: rxBytes > 0 ? rxBytes : undefined,
      txBytes: txBytes > 0 ? txBytes : undefined,
    };
  }
}

export const processService = new ProcessService();
