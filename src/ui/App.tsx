import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useApp, useInput } from 'ink';
import { spawn } from 'child_process';
import { Header } from './components/Header.js';
import { ServerTable } from './components/ServerTable.js';
import { LogPanel } from './components/LogPanel.js';
import { ActionBar } from './components/ActionBar.js';
import { ConfirmDialog } from './components/ConfirmDialog.js';
import {
  ConfigMenu,
  ServerListView,
  TypeListView,
  ServerForm,
  ServerTypeForm,
} from './components/config/index.js';
import { useServers } from './hooks/useServers.js';
import { useServerLogs } from './hooks/useServerLogs.js';
import { useConfig } from './hooks/useConfig.js';
import { serverService, backupService, screenService } from '../services/index.js';

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

const Dashboard: React.FC = () => {
  const { exit } = useApp();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showLogs, setShowLogs] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setTick] = useState(0);

  const [mode, setMode] = useState<AppMode>('dashboard');
  const [editing, setEditing] = useState<EditingState>({ isNew: false });
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const { servers, refresh, isLoading } = useServers(2000);
  const selectedServer = servers[selectedIndex];
  const logs = useServerLogs(selectedServer?.config.path);

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
  } = useConfig();

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(undefined), 3000);
  }, []);

  const handleStart = useCallback(async () => {
    if (!selectedServer || isProcessing) return;
    setIsProcessing(true);
    showMessage(`Starting ${selectedServer.name}...`);

    const result = await serverService.start(selectedServer.name, false);
    showMessage(result.message);
    await refresh();
    setIsProcessing(false);
  }, [selectedServer, isProcessing, showMessage, refresh]);

  const handleStop = useCallback(async () => {
    if (!selectedServer || isProcessing) return;
    setIsProcessing(true);
    showMessage(`Stopping ${selectedServer.name}...`);

    const result = await serverService.stop(selectedServer.name);
    showMessage(result.message);
    await refresh();
    setIsProcessing(false);
  }, [selectedServer, isProcessing, showMessage, refresh]);

  const handleRestart = useCallback(async () => {
    if (!selectedServer || isProcessing) return;
    setIsProcessing(true);
    showMessage(`Restarting ${selectedServer.name}...`);

    const result = await serverService.restart(selectedServer.name);
    showMessage(result.message);
    await refresh();
    setIsProcessing(false);
  }, [selectedServer, isProcessing, showMessage, refresh]);

  const handleBackup = useCallback(async () => {
    if (!selectedServer || isProcessing) return;
    setIsProcessing(true);
    showMessage(`Creating backup for ${selectedServer.name}...`);

    const result = await backupService.createBackup(selectedServer.name);
    if (result.success) {
      showMessage(`Backup created: ${result.size}`);
    } else {
      showMessage(`Backup failed: ${result.error}`);
    }
    setIsProcessing(false);
  }, [selectedServer, isProcessing, showMessage]);

  const handleConsole = useCallback(async () => {
    if (!selectedServer || isProcessing) return;

    const isRunning = await screenService.exists(selectedServer.name);
    if (!isRunning) {
      showMessage(`Server ${selectedServer.name} is not running`);
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
      showMessage(`Server '${name}' added`);
    } else {
      await updateServer(name, config);
      showMessage(`Server '${name}' updated`);
    }
    await refresh();
    setMode('server-list');
  }, [editing.isNew, addServer, updateServer, refresh, showMessage]);

  const handleSaveServerType = useCallback(async (name: string, config: Parameters<typeof addServerType>[1]) => {
    if (editing.isNew) {
      await addServerType(name, config);
      showMessage(`Server type '${name}' added`);
    } else {
      await updateServerType(name, config);
      showMessage(`Server type '${name}' updated`);
    }
    setMode('type-list');
  }, [editing.isNew, addServerType, updateServerType, showMessage]);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmState) return;

    try {
      if (confirmState.itemType === 'server') {
        await deleteServer(confirmState.itemName);
        showMessage(`Server '${confirmState.itemName}' deleted`);
        await refresh();
        setMode('server-list');
      } else {
        await deleteServerType(confirmState.itemName);
        showMessage(`Server type '${confirmState.itemName}' deleted`);
        setMode('type-list');
      }
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Delete failed');
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
      setSelectedIndex(i => Math.max(0, i - 1));
      return;
    }

    if (key.downArrow) {
      setSelectedIndex(i => Math.min(servers.length - 1, i + 1));
      return;
    }

    if (input === 'l') {
      setShowLogs(s => !s);
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
      return;
    }
  });

  if (mode === 'confirm-delete' && confirmState) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title="Minecraft Server Manager" />
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
        <Header title="Minecraft Server Manager" />
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
        <Header title="Minecraft Server Manager" />
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
        {message && (
          <Box marginTop={1}>
            <Text color="yellow">{message}</Text>
          </Box>
        )}
      </Box>
    );
  }

  if (mode === 'server-form') {
    const serverTypeNames = Object.keys(serverTypes);
    return (
      <Box flexDirection="column" padding={1}>
        <Header title="Minecraft Server Manager" />
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
        <Header title="Minecraft Server Manager" />
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
        {message && (
          <Box marginTop={1}>
            <Text color="yellow">{message}</Text>
          </Box>
        )}
      </Box>
    );
  }

  if (mode === 'type-form') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title="Minecraft Server Manager" />
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
      <Header title="Minecraft Server Manager" />

      <Box flexDirection="row" marginTop={1}>
        <Box flexDirection="column" width={showLogs ? '55%' : '100%'}>
          <ServerTable
            servers={servers}
            selectedIndex={selectedIndex}
            isLoading={isLoading}
          />
        </Box>

        {showLogs && selectedServer && (
          <Box flexDirection="column" width="45%" marginLeft={1}>
            <LogPanel
              serverName={selectedServer.name}
              logs={logs}
            />
          </Box>
        )}
      </Box>

      <ActionBar message={message} showEditKey />
    </Box>
  );
};

export function renderDashboard(): void {
  render(<Dashboard />);
}
