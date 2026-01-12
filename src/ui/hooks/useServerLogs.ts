import { useState, useEffect } from 'react';
import { readFile, access } from 'fs/promises';
import { constants } from 'fs';
import { getLatestLogPath } from '../../utils/paths.js';

const MAX_LINES = 20;

export function useServerLogs(serverPath: string | undefined, pollInterval: number = 1000) {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!serverPath) {
      setLogs([]);
      return;
    }

    const logPath = getLatestLogPath(serverPath);

    const fetchLogs = async () => {
      try {
        await access(logPath, constants.F_OK);
        const content = await readFile(logPath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        setLogs(lines.slice(-MAX_LINES));
      } catch {
        setLogs([]);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, pollInterval);
    return () => clearInterval(interval);
  }, [serverPath, pollInterval]);

  return logs;
}
