import { useState, useCallback, useEffect } from 'react';
import { configService } from '../../services/index.js';
import type { ServerConfig, ServerTypeConfig } from '../../types/config.js';

export interface UseConfigReturn {
  servers: Record<string, ServerConfig>;
  serverTypes: Record<string, ServerTypeConfig>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addServer: (name: string, config: ServerConfig) => Promise<void>;
  updateServer: (name: string, config: ServerConfig) => Promise<void>;
  deleteServer: (name: string) => Promise<void>;
  addServerType: (name: string, config: ServerTypeConfig) => Promise<void>;
  updateServerType: (name: string, config: ServerTypeConfig) => Promise<void>;
  deleteServerType: (name: string) => Promise<void>;
}

export function useConfig(): UseConfigReturn {
  const [servers, setServers] = useState<Record<string, ServerConfig>>({});
  const [serverTypes, setServerTypes] = useState<Record<string, ServerTypeConfig>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await configService.reload();
      const [allServers, allTypes] = await Promise.all([
        configService.getAllServers(),
        configService.getAllServerTypes(),
      ]);
      setServers(allServers);
      setServerTypes(allTypes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load config');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addServer = useCallback(async (name: string, config: ServerConfig) => {
    await configService.addServer(name, config);
    await refresh();
  }, [refresh]);

  const updateServer = useCallback(async (name: string, config: ServerConfig) => {
    await configService.updateServer(name, config);
    await refresh();
  }, [refresh]);

  const deleteServer = useCallback(async (name: string) => {
    await configService.deleteServer(name);
    await refresh();
  }, [refresh]);

  const addServerType = useCallback(async (name: string, config: ServerTypeConfig) => {
    await configService.addServerType(name, config);
    await refresh();
  }, [refresh]);

  const updateServerType = useCallback(async (name: string, config: ServerTypeConfig) => {
    await configService.updateServerType(name, config);
    await refresh();
  }, [refresh]);

  const deleteServerType = useCallback(async (name: string) => {
    await configService.deleteServerType(name);
    await refresh();
  }, [refresh]);

  return {
    servers,
    serverTypes,
    isLoading,
    error,
    refresh,
    addServer,
    updateServer,
    deleteServer,
    addServerType,
    updateServerType,
    deleteServerType,
  };
}
