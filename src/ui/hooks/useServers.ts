import { useState, useEffect, useCallback } from 'react';
import { serverService } from '../../services/index.js';
import type { ServerInfo } from '../../types/server.js';

export function useServers(pollInterval: number = 2000) {
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const status = await serverService.getAllStatus();
      setServers(status);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, pollInterval);
    return () => clearInterval(interval);
  }, [refresh, pollInterval]);

  return { servers, refresh, isLoading, error };
}
