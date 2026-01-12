import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useApp, useInput } from 'ink';
import { Header } from './components/Header.js';
import { ServerTable } from './components/ServerTable.js';
import { LogPanel } from './components/LogPanel.js';
import { ActionBar } from './components/ActionBar.js';
import { useServers } from './hooks/useServers.js';
import { useServerLogs } from './hooks/useServerLogs.js';
import { serverService, backupService } from '../services/index.js';

const Dashboard: React.FC = () => {
  const { exit } = useApp();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showLogs, setShowLogs] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setTick] = useState(0);

  const { servers, refresh, isLoading } = useServers(2000);
  const selectedServer = servers[selectedIndex];
  const logs = useServerLogs(selectedServer?.config.path);

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

  useInput((input, key) => {
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

    if (key.return) {
      refresh();
      return;
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Header title="Minecraft Server Manager" />

      <Box flexDirection="row" marginTop={1}>
        <Box flexDirection="column" width={showLogs ? '60%' : '100%'}>
          <ServerTable
            servers={servers}
            selectedIndex={selectedIndex}
            isLoading={isLoading}
          />
        </Box>

        {showLogs && selectedServer && (
          <Box flexDirection="column" width="40%" marginLeft={2}>
            <LogPanel
              serverName={selectedServer.name}
              logs={logs}
            />
          </Box>
        )}
      </Box>

      <ActionBar message={message} />
    </Box>
  );
};

export function renderDashboard(): void {
  render(<Dashboard />);
}
