import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { render, Box, Text, useApp, useInput, useStdout } from 'ink';
import { spawn } from 'child_process';
import { Header } from './components/Header.js';
import { ServerTable } from './components/ServerTable.js';
import { ActionBar } from './components/ActionBar.js';
import { ConfirmDialog } from './components/ConfirmDialog.js';
import { MessageBar, ServerDetailsPanel } from './components/index.js';
import {
  ConfigMenu,
  ServerListView,
  TypeListView,
  ServerForm,
  ServerTypeForm,
} from './components/config/index.js';
import { useServers } from './hooks/useServers.js';
import { useConfig } from './hooks/useConfig.js';
import { useServerLogs } from './hooks/useServerLogs.js';
import { serverService, backupService, screenService } from '../services/index.js';
import { configService } from '../services/config.service.js';

type AppMode =
  | 'dashboard'
  | 'config-menu'
  | 'server-list'
  | 'server-form'
  | 'type-list'
  | 'type-form'
  | 'confirm-delete';

interface EditingState {
  name?: string;
  isNew: boolean;
}

interface ConfirmState {
  message: string;
  itemName: string;
  itemType: 'server' | 'type';
}

type MessageState = {
  level: 'info' | 'success' | 'error';
  text: string;
};

interface EventRecord {
  timestamp: string;
  level: MessageState['level'];
  text: string;
}

const APP_TITLE = 'Minecraft Control Studio';
const EVENT_LIMIT = 6;

const Dashboard: React.FC = () => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [selectedName, setSelectedName] = useState<string | undefined>();
  const [message, setMessage] = useState<MessageState | undefined>();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [mode, setMode] = useState<AppMode>('dashboard');
  const [editing, setEditing] = useState<EditingState>({ isNew: false });
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const { servers, refresh, isLoading, error, lastUpdated } = useServers(2000);
  const selectedIndex = useMemo(() => {
    if (!selectedName) {
      return servers.length > 0 ? 0 : -1;
    }
    return servers.findIndex(server => server.name === selectedName);
  }, [selectedName, servers]);
  const selectedServer = selectedIndex >= 0 ? servers[selectedIndex] : servers[0];
  const {
    servers: configServers,
    serverTypes,
    refresh: refreshConfig,
    addServer,
    updateServer,
    deleteServer,
    addServerType,
    updateServerType,
    deleteServerType,
    isLoading: isConfigLoading,
    error: configError,
  } = useConfig();
  const configPath = configService.getConfigPath();
  const runningServers = servers.filter(server => server.status === 'running').length;
  const stoppedServers = Math.max(0, servers.length - runningServers);
  const selectedLogs = useServerLogs(selectedServer?.config.path, 1500);
  const terminalWidth = stdout?.columns ?? 120;
  const isNarrow = terminalWidth < 110;
  const isCompact = terminalWidth < 150;
  const contentDirection = isCompact ? 'column' : 'row';

  useEffect(() => {
    if (servers.length === 0) {
      setSelectedName(undefined);
      return;
    }

    if (!selectedName || !servers.some(server => server.name === selectedName)) {
      setSelectedName(servers[0].name);
    }
  }, [selectedName, servers]);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  const showMessage = useCallback((text: string, level: MessageState['level'] = 'info', duration = 4000) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setEvents(previous => [{ timestamp, level, text }, ...previous].slice(0, EVENT_LIMIT));

    setMessage({ text, level });

    if (duration > 0) {
      messageTimeoutRef.current = setTimeout(() => {
        setMessage(undefined);
        messageTimeoutRef.current = undefined;
      }, duration);
    }
  }, []);

  const showActionResult = useCallback((result: { success: boolean; message: string }) => {
    showMessage(result.message, result.success ? 'success' : 'error');
  }, [showMessage]);

  useEffect(() => {
    if (configError) {
      showMessage(configError, 'error', 6000);
    }
  }, [configError, showMessage]);

  const handleStart = useCallback(async () => {
    if (!selectedServer || isProcessing) return;
    setIsProcessing(true);
    showMessage(`Starting ${selectedServer.name}...`);

    try {
      const result = await serverService.start(selectedServer.name, false);
      showActionResult(result);
      await refresh();
    } finally {
      setIsProcessing(false);
    }
  }, [selectedServer, isProcessing, showMessage, showActionResult, refresh]);

  const handleStop = useCallback(async () => {
    if (!selectedServer || isProcessing) return;
    setIsProcessing(true);
    showMessage(`Stopping ${selectedServer.name}...`);

    try {
      const result = await serverService.stop(selectedServer.name);
      showActionResult(result);
      await refresh();
    } finally {
      setIsProcessing(false);
    }
  }, [selectedServer, isProcessing, showMessage, showActionResult, refresh]);

  const handleRestart = useCallback(async () => {
    if (!selectedServer || isProcessing) return;
    setIsProcessing(true);
    showMessage(`Restarting ${selectedServer.name}...`);

    try {
      const result = await serverService.restart(selectedServer.name);
      showActionResult(result);
      await refresh();
    } finally {
      setIsProcessing(false);
    }
  }, [selectedServer, isProcessing, showMessage, showActionResult, refresh]);

  const handleBackup = useCallback(async () => {
    if (!selectedServer || isProcessing) return;
    setIsProcessing(true);
    showMessage(`Creating backup for ${selectedServer.name}...`);

    try {
      const result = await backupService.createBackup(selectedServer.name);
      if (result.success) {
        showMessage(`Backup created: ${result.size}`, 'success');
      } else {
        showMessage(`Backup failed: ${result.error}`, 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [selectedServer, isProcessing, showMessage]);

  const handleConsole = useCallback(async () => {
    if (!selectedServer || isProcessing) return;

    const isRunning = await screenService.exists(selectedServer.name);
    if (!isRunning) {
      showMessage(`Server ${selectedServer.name} is not running`, 'error');
      return;
    }

    exit();

    setTimeout(() => {
      console.clear();
      console.log(`Attaching to ${selectedServer.name} console...`);
      console.log('Press Ctrl+A, D to detach\n');

      const screen = spawn('screen', ['-x', selectedServer.name], {
        stdio: 'inherit'
      });

      screen.on('close', () => {
        console.clear();
        renderDashboard();
      });
    }, 100);
  }, [selectedServer, isProcessing, exit, showMessage]);

  const handleSaveServer = useCallback(async (name: string, config: Parameters<typeof addServer>[1]) => {
    if (editing.isNew) {
      await addServer(name, config);
      showMessage(`Server '${name}' added`, 'success');
    } else {
      await updateServer(name, config);
      showMessage(`Server '${name}' updated`, 'success');
    }
    await refresh();
    setMode('server-list');
  }, [editing.isNew, addServer, updateServer, refresh, showMessage]);

  const handleSaveServerType = useCallback(async (name: string, config: Parameters<typeof addServerType>[1]) => {
    if (editing.isNew) {
      await addServerType(name, config);
      showMessage(`Server type '${name}' added`, 'success');
    } else {
      await updateServerType(name, config);
      showMessage(`Server type '${name}' updated`, 'success');
    }
    setMode('type-list');
  }, [editing.isNew, addServerType, updateServerType, showMessage]);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmState) return;

    try {
      if (confirmState.itemType === 'server') {
        await deleteServer(confirmState.itemName);
        showMessage(`Server '${confirmState.itemName}' deleted`, 'success');
        await refresh();
        setMode('server-list');
      } else {
        await deleteServerType(confirmState.itemName);
        showMessage(`Server type '${confirmState.itemName}' deleted`, 'success');
        setMode('type-list');
      }
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Delete failed', 'error');
      setMode(confirmState.itemType === 'server' ? 'server-list' : 'type-list');
    }
    setConfirmState(null);
  }, [confirmState, deleteServer, deleteServerType, refresh, showMessage]);

  useInput((input, key) => {
    if (mode !== 'dashboard') return;
    if (isProcessing) return;

    if (input === 'q') {
      exit();
      return;
    }

    if (key.upArrow) {
      const nextIndex = Math.max(0, selectedIndex - 1);
      if (servers[nextIndex]) {
        setSelectedName(servers[nextIndex].name);
      }
      return;
    }

    if (key.downArrow) {
      const nextIndex = Math.min(servers.length - 1, selectedIndex + 1);
      if (servers[nextIndex]) {
        setSelectedName(servers[nextIndex].name);
      }
      return;
    }

    if (input === 's') {
      handleStart();
      return;
    }

    if (input === 'x') {
      handleStop();
      return;
    }

    if (input === 'r') {
      handleRestart();
      return;
    }

    if (input === 'b') {
      handleBackup();
      return;
    }

    if (input === 'c') {
      handleConsole();
      return;
    }

    if (input === 'e') {
      refreshConfig();
      setMode('config-menu');
      return;
    }

    if (key.return) {
      refresh();
      showMessage('Matrix sync requested', 'info', 1500);
      return;
    }
  });

  if (mode === 'confirm-delete' && confirmState) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={APP_TITLE}
          activeMode="Confirm Delete"
          totalServers={servers.length}
          runningServers={runningServers}
          configPath={configPath}
          compact={isCompact}
          lastUpdated={lastUpdated}
        />
        <ConfirmDialog
          message={confirmState.message}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setConfirmState(null);
            setMode(confirmState.itemType === 'server' ? 'server-list' : 'type-list');
          }}
        />
      </Box>
    );
  }

  if (mode === 'config-menu') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={APP_TITLE}
          activeMode={isConfigLoading ? 'Config Loading' : 'Config Menu'}
          totalServers={servers.length}
          runningServers={runningServers}
          configPath={configPath}
          compact={isCompact}
          lastUpdated={lastUpdated}
          isRefreshing={isConfigLoading}
        />
        <ConfigMenu
          serverCount={Object.keys(configServers).length}
          typeCount={Object.keys(serverTypes).length}
          onSelect={(section) => {
            if (section === 'servers') {
              setMode('server-list');
            } else {
              setMode('type-list');
            }
          }}
          onBack={() => setMode('dashboard')}
        />
      </Box>
    );
  }

  if (mode === 'server-list') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={APP_TITLE}
          activeMode="Server Registry"
          totalServers={servers.length}
          runningServers={runningServers}
          configPath={configPath}
          compact={isCompact}
          lastUpdated={lastUpdated}
          isRefreshing={isConfigLoading}
        />
        <ServerListView
          servers={configServers}
          onAdd={() => {
            setEditing({ isNew: true });
            setMode('server-form');
          }}
          onEdit={(name) => {
            setEditing({ name, isNew: false });
            setMode('server-form');
          }}
          onDelete={(name) => {
            setConfirmState({
              message: `Delete server '${name}'? This cannot be undone.`,
              itemName: name,
              itemType: 'server',
            });
            setMode('confirm-delete');
          }}
          onBack={() => setMode('config-menu')}
        />
        <Box marginTop={1}>
          <MessageBar message={message?.text} level={message?.level} />
        </Box>
      </Box>
    );
  }

  if (mode === 'server-form') {
    const serverTypeNames = Object.keys(serverTypes);
    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={APP_TITLE}
          activeMode={editing.isNew ? 'Create Instance' : 'Edit Instance'}
          totalServers={servers.length}
          runningServers={runningServers}
          configPath={configPath}
          compact={isCompact}
          lastUpdated={lastUpdated}
        />
        <ServerForm
          isNew={editing.isNew}
          serverName={editing.name}
          initialValues={editing.name ? configServers[editing.name] : undefined}
          serverTypes={serverTypeNames}
          onSave={handleSaveServer}
          onCancel={() => setMode('server-list')}
        />
      </Box>
    );
  }

  if (mode === 'type-list') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={APP_TITLE}
          activeMode="Profile Registry"
          totalServers={servers.length}
          runningServers={runningServers}
          configPath={configPath}
          compact={isCompact}
          lastUpdated={lastUpdated}
          isRefreshing={isConfigLoading}
        />
        <TypeListView
          types={serverTypes}
          onAdd={() => {
            setEditing({ isNew: true });
            setMode('type-form');
          }}
          onEdit={(name) => {
            setEditing({ name, isNew: false });
            setMode('type-form');
          }}
          onDelete={(name) => {
            setConfirmState({
              message: `Delete server type '${name}'? This cannot be undone.`,
              itemName: name,
              itemType: 'type',
            });
            setMode('confirm-delete');
          }}
          onBack={() => setMode('config-menu')}
        />
        <Box marginTop={1}>
          <MessageBar message={message?.text} level={message?.level} />
        </Box>
      </Box>
    );
  }

  if (mode === 'type-form') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={APP_TITLE}
          activeMode={editing.isNew ? 'Create Profile' : 'Edit Profile'}
          totalServers={servers.length}
          runningServers={runningServers}
          configPath={configPath}
          compact={isCompact}
          lastUpdated={lastUpdated}
        />
        <ServerTypeForm
          isNew={editing.isNew}
          typeName={editing.name}
          initialValues={editing.name ? serverTypes[editing.name] : undefined}
          onSave={handleSaveServerType}
          onCancel={() => setMode('type-list')}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Header
        title={APP_TITLE}
        activeMode="Dashboard"
        totalServers={servers.length}
        runningServers={runningServers}
        configPath={configPath}
        compact={isCompact}
        lastUpdated={lastUpdated}
        isRefreshing={isLoading || isProcessing}
      />

      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text>
          <Text color="greenBright" bold>RUNNING {runningServers}</Text>
          <Text color="gray">   </Text>
          <Text color="redBright" bold>STOPPED {stoppedServers}</Text>
          <Text color="gray">   </Text>
          <Text color="yellowBright" bold>SELECTED {selectedServer?.name ?? 'none'}</Text>
          <Text color="gray">   </Text>
          <Text color={isProcessing ? 'yellowBright' : 'gray'}>
            {isProcessing ? 'PIPELINE BUSY' : 'PIPELINE READY'}
          </Text>
        </Text>
      </Box>

      <Box flexDirection={contentDirection} alignItems="flex-start" marginTop={1}>
        <Box flexDirection="column" width={isCompact ? '100%' : '64%'}>
          <ServerTable
            servers={servers}
            selectedIndex={selectedIndex}
            isLoading={isLoading}
            error={error}
            compact={isCompact}
            narrow={isNarrow}
          />

          <Box marginTop={1}>
            <MessageBar message={message?.text} level={message?.level} fullWidth />
          </Box>
        </Box>

        <Box
          flexDirection="column"
          width={isCompact ? '100%' : '36%'}
          marginLeft={isCompact ? 0 : 1}
          marginTop={isCompact ? 1 : 0}
        >
          <ServerDetailsPanel
            server={selectedServer}
            isProcessing={isProcessing}
            compact={isNarrow}
          />

          <ActionBar showEditKey compact />
        </Box>
      </Box>

      <Box flexDirection={contentDirection} alignItems="flex-start" marginTop={1}>
        <Box flexDirection="column" width={isCompact ? '100%' : '52%'}>
          <Box borderStyle="doubleSingle" borderColor="blueBright" paddingX={1} flexDirection="column">
            <Text bold color="blueBright">EVENT STREAM</Text>
            <Box marginTop={1} flexDirection="column">
              {events.length === 0 ? (
                <Text color="gray">NO EVENTS YET</Text>
              ) : (
                events.map((event, index) => {
                  const levelColor = event.level === 'success'
                    ? 'greenBright'
                    : event.level === 'error'
                      ? 'redBright'
                      : 'blueBright';
                  const levelLabel = event.level === 'success'
                    ? 'OK'
                    : event.level === 'error'
                      ? 'FAIL'
                      : 'INFO';

                  return (
                    <Text key={`${event.timestamp}-${index}`} wrap="truncate-end">
                      <Text color="gray">{index + 1}. </Text>
                      <Text color="gray">[{event.timestamp}] </Text>
                      <Text color={levelColor}>{levelLabel}</Text>
                      <Text color="gray">{' -> '}</Text>
                      <Text>{event.text}</Text>
                    </Text>
                  );
                })
              )}
            </Box>
          </Box>
        </Box>

        <Box
          flexDirection="column"
          width={isCompact ? '100%' : '48%'}
          marginLeft={isCompact ? 0 : 1}
          marginTop={isCompact ? 1 : 0}
        >
          <Box borderStyle="doubleSingle" borderColor="yellowBright" paddingX={1} flexDirection="column">
            <Text bold color="yellowBright">LIVE LOG TAIL</Text>
            <Box marginTop={1} flexDirection="column">
              {!selectedServer ? (
                <Text color="gray">SELECT AN INSTANCE TO READ LOGS</Text>
              ) : selectedLogs.length === 0 ? (
                <Text color="gray">NO RECENT LOGS FOR {selectedServer.name.toUpperCase()}</Text>
              ) : (
                selectedLogs.slice(-8).map((line, index) => (
                  <Text key={`${selectedServer.name}-${index}`} color="gray" wrap="truncate-end">
                    <Text color="yellow">{String(index + 1).padStart(2, '0')}</Text>
                    <Text color="gray"> | </Text>
                    <Text>{line}</Text>
                  </Text>
                ))
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export function renderDashboard(): void {
  render(<Dashboard />);
}
