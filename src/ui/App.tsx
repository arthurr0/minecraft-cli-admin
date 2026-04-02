import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Box, Text, render, useApp, useInput, useStdout } from 'ink';
import { spawn } from 'child_process';
import type { ServerConfig, ServerTypeConfig } from '../types/config.js';
import { backupService, screenService, serverService } from '../services/index.js';
import { configService } from '../services/config.service.js';
import { validateMemoryFormat, validatePath, validatePort, validateServerName, validateServerTypeName } from '../utils/validator.js';
import { useConfig } from './hooks/useConfig.js';
import { useServers } from './hooks/useServers.js';
import { appReducer, initialState, type Screen } from './core/state.js';
import type { EventRecord, NoticeLevel, ServerEditorModel, TypeEditorModel } from './core/types.js';
import {
  ConfigHomeScreen,
  ConfigServersScreen,
  ConfigTypesScreen,
  ConfirmDeleteScreen,
  OverviewScreen,
  ServerEditorScreen,
  TypeEditorScreen,
} from './screens/index.js';
import {
  CommandBar,
  NoticeStrip,
  ServerDetailsPanel,
  ServerSidebar,
  ShortcutStrip,
  StatusBar,
} from './primitives/index.js';

const EVENT_LIMIT = 8;

function timestamp(): string {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

function firstServerName(names: string[], fallback = 0): number {
  if (names.length === 0) {
    return 0;
  }

  return Math.min(Math.max(0, fallback), names.length - 1);
}

function getOverviewColumns(terminalWidth: number, serverCount: number): number {
  const baseColumns = terminalWidth >= 168 ? 3 : terminalWidth >= 108 ? 2 : 1;
  return Math.max(1, Math.min(baseColumns, Math.max(1, serverCount)));
}

const DashboardRoot: React.FC = () => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [editorError, setEditorError] = useState<string | undefined>(undefined);
  const clearMessageRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const { servers, refresh, isLoading, error, lastUpdated } = useServers(5000);
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
    error: configError,
  } = useConfig();

  const selectedServer = useMemo(() => {
    if (servers.length === 0) {
      return undefined;
    }

    if (!state.selectedServerName) {
      return servers[0];
    }

    return servers.find((server) => server.name === state.selectedServerName) ?? servers[0];
  }, [servers, state.selectedServerName]);

  const runningServers = servers.filter((server) => server.status === 'running').length;
  const terminalWidth = stdout?.columns ?? 120;
  const overviewColumns = getOverviewColumns(terminalWidth, servers.length);

  const configServerNames = useMemo(() => Object.keys(configServers), [configServers]);
  const configTypeNames = useMemo(() => Object.keys(serverTypes), [serverTypes]);

  useEffect(() => {
    if (servers.length === 0) {
      dispatch({ type: 'setSelectedServerName', name: undefined });
      return;
    }

    if (!state.selectedServerName || !servers.some((server) => server.name === state.selectedServerName)) {
      dispatch({ type: 'setSelectedServerName', name: servers[0].name });
    }
  }, [servers, state.selectedServerName]);

  useEffect(() => {
    return () => {
      if (clearMessageRef.current) {
        clearTimeout(clearMessageRef.current);
      }
    };
  }, []);

  const pushNotice = useCallback((text: string, level: NoticeLevel = 'info', timeout = 4000) => {
    dispatch({ type: 'setNotice', notice: { text, level } });

    const event: EventRecord = {
      timestamp: timestamp(),
      level,
      text,
    };

    dispatch({ type: 'pushEvent', event, limit: EVENT_LIMIT });

    if (clearMessageRef.current) {
      clearTimeout(clearMessageRef.current);
    }

    if (timeout > 0) {
      clearMessageRef.current = setTimeout(() => {
        dispatch({ type: 'setNotice', notice: undefined });
        clearMessageRef.current = undefined;
      }, timeout);
    }
  }, []);

  useEffect(() => {
    if (configError) {
      pushNotice(configError, 'error', 6000);
    }
  }, [configError, pushNotice]);

  const runServerAction = useCallback(async (
    actionName: string,
    action: () => Promise<{ success: boolean; message: string }>,
  ) => {
    if (!selectedServer || state.processing) {
      return;
    }

    dispatch({ type: 'setProcessing', value: true });
    pushNotice(`${actionName} ${selectedServer.name}...`, 'info', 2000);

    try {
      const result = await action();
      pushNotice(result.message, result.success ? 'success' : 'error');
      await refresh();
    } catch (actionError) {
      pushNotice(actionError instanceof Error ? actionError.message : 'Unexpected failure', 'error');
    } finally {
      dispatch({ type: 'setProcessing', value: false });
    }
  }, [selectedServer, state.processing, pushNotice, refresh]);

  const startSelectedServer = useCallback(async () => {
    if (!selectedServer) {
      return;
    }

    await runServerAction('Starting', () => serverService.start(selectedServer.name, false));
  }, [runServerAction, selectedServer]);

  const stopSelectedServer = useCallback(async () => {
    if (!selectedServer) {
      return;
    }

    await runServerAction('Stopping', () => serverService.stop(selectedServer.name));
  }, [runServerAction, selectedServer]);

  const restartSelectedServer = useCallback(async () => {
    if (!selectedServer) {
      return;
    }

    await runServerAction('Restarting', () => serverService.restart(selectedServer.name));
  }, [runServerAction, selectedServer]);

  const backupSelectedServer = useCallback(async () => {
    if (!selectedServer || state.processing) {
      return;
    }

    dispatch({ type: 'setProcessing', value: true });
    pushNotice(`Creating backup for ${selectedServer.name}...`, 'info', 2000);

    try {
      const result = await backupService.createBackup(selectedServer.name);
      if (result.success) {
        pushNotice(`Backup created (${result.size ?? 'unknown size'})`, 'success');
      } else {
        pushNotice(result.error ?? 'Backup failed', 'error');
      }
    } finally {
      dispatch({ type: 'setProcessing', value: false });
    }
  }, [selectedServer, state.processing, pushNotice]);

  const openConsole = useCallback(async () => {
    if (!selectedServer || state.processing) {
      return;
    }

    const exists = await screenService.exists(selectedServer.name);
    if (!exists) {
      pushNotice(`Server ${selectedServer.name} is not running`, 'error');
      return;
    }

    exit();

    setTimeout(() => {
      console.clear();
      console.log(`Attaching to ${selectedServer.name} console...`);
      console.log('Press Ctrl+A, D to detach\n');

      const screen = spawn('screen', ['-x', selectedServer.name], { stdio: 'inherit' });
      screen.on('close', () => {
        console.clear();
        renderDashboard();
      });
    }, 100);
  }, [selectedServer, state.processing, pushNotice, exit]);

  const openConfigHome = useCallback(async () => {
    await refreshConfig();
    dispatch({ type: 'setScreen', screen: 'config-home' });
  }, [refreshConfig]);

  const openServerEditor = useCallback((isNew: boolean) => {
    const selectedName = configServerNames[state.selectedConfigServer];
    const selected = selectedName ? configServers[selectedName] : undefined;

    const model: ServerEditorModel = {
      isNew,
      originalName: isNew ? undefined : selectedName,
      name: isNew ? '' : (selectedName ?? ''),
      type: selected?.type ?? configTypeNames[0] ?? '',
      path: selected?.path ?? '',
      port: selected?.port === undefined ? '' : String(selected.port),
      focus: 0,
    };

    setEditorError(undefined);
    dispatch({ type: 'openServerEditor', model });
  }, [configServerNames, configServers, configTypeNames, state.selectedConfigServer]);

  const openTypeEditor = useCallback((isNew: boolean) => {
    const selectedName = configTypeNames[state.selectedConfigType];
    const selected = selectedName ? serverTypes[selectedName] : undefined;

    const model: TypeEditorModel = {
      isNew,
      originalName: isNew ? undefined : selectedName,
      name: isNew ? '' : (selectedName ?? ''),
      memory: selected?.memory ?? '2G',
      minMemory: selected?.min_memory ?? '1G',
      jvmFlags: selected?.jvm_flags.join(' | ') ?? '',
      focus: 0,
    };

    setEditorError(undefined);
    dispatch({ type: 'openTypeEditor', model });
  }, [configTypeNames, serverTypes, state.selectedConfigType]);

  const saveServerEditor = useCallback(async () => {
    const model = state.serverEditor;
    if (!model) {
      return;
    }

    const name = model.name.trim();
    const typeName = model.type.trim();
    const pathValue = model.path.trim();
    const portText = model.port.trim();

    if (model.isNew) {
      const nameValidation = validateServerName(name);
      if (!nameValidation.valid) {
        setEditorError(nameValidation.error);
        return;
      }
    }

    const pathValidation = validatePath(pathValue);
    if (!pathValidation.valid) {
      setEditorError(pathValidation.error);
      return;
    }

    if (typeName === '') {
      setEditorError('Server type cannot be empty');
      return;
    }

    let port: number | undefined;
    if (portText !== '') {
      const parsedPort = Number(portText);
      if (!Number.isInteger(parsedPort)) {
        setEditorError('Port must be an integer');
        return;
      }

      const portValidation = validatePort(parsedPort);
      if (!portValidation.valid) {
        setEditorError(portValidation.error);
        return;
      }

      port = parsedPort;
    }

    const payload: ServerConfig = {
      type: typeName,
      path: pathValue,
      port,
    };

    try {
      if (model.isNew) {
        await addServer(name, payload);
        pushNotice(`Server '${name}' added`, 'success');
      } else if (model.originalName) {
        await updateServer(model.originalName, payload);
        pushNotice(`Server '${model.originalName}' updated`, 'success');
      }

      await refresh();
      setEditorError(undefined);
      dispatch({ type: 'clearServerEditor' });
      dispatch({ type: 'setScreen', screen: 'config-servers' });
    } catch (saveError) {
      setEditorError(saveError instanceof Error ? saveError.message : 'Failed to save server');
    }
  }, [state.serverEditor, addServer, updateServer, refresh, pushNotice]);

  const saveTypeEditor = useCallback(async () => {
    const model = state.typeEditor;
    if (!model) {
      return;
    }

    const name = model.name.trim();
    const memory = model.memory.trim();
    const minMemory = model.minMemory.trim();
    const flags = model.jvmFlags
      .split('|')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (model.isNew) {
      const nameValidation = validateServerTypeName(name);
      if (!nameValidation.valid) {
        setEditorError(nameValidation.error);
        return;
      }
    }

    const memoryValidation = validateMemoryFormat(memory);
    if (!memoryValidation.valid) {
      setEditorError(memoryValidation.error);
      return;
    }

    const minMemoryValidation = validateMemoryFormat(minMemory);
    if (!minMemoryValidation.valid) {
      setEditorError(minMemoryValidation.error);
      return;
    }

    const payload: ServerTypeConfig = {
      memory,
      min_memory: minMemory,
      jvm_flags: flags,
    };

    try {
      if (model.isNew) {
        await addServerType(name, payload);
        pushNotice(`Server type '${name}' added`, 'success');
      } else if (model.originalName) {
        await updateServerType(model.originalName, payload);
        pushNotice(`Server type '${model.originalName}' updated`, 'success');
      }

      setEditorError(undefined);
      dispatch({ type: 'clearTypeEditor' });
      dispatch({ type: 'setScreen', screen: 'config-types' });
    } catch (saveError) {
      setEditorError(saveError instanceof Error ? saveError.message : 'Failed to save server type');
    }
  }, [state.typeEditor, addServerType, updateServerType, pushNotice]);

  const requestDeleteServer = useCallback(() => {
    const name = configServerNames[state.selectedConfigServer];
    if (!name) {
      return;
    }

    dispatch({
      type: 'setDeleteIntent',
      intent: {
        entity: 'server',
        name,
        message: `Delete server '${name}'? This cannot be undone.`,
      },
    });
    dispatch({ type: 'setScreen', screen: 'confirm-delete' });
  }, [configServerNames, state.selectedConfigServer]);

  const requestDeleteType = useCallback(() => {
    const name = configTypeNames[state.selectedConfigType];
    if (!name) {
      return;
    }

    dispatch({
      type: 'setDeleteIntent',
      intent: {
        entity: 'type',
        name,
        message: `Delete server type '${name}'? This cannot be undone.`,
      },
    });
    dispatch({ type: 'setScreen', screen: 'confirm-delete' });
  }, [configTypeNames, state.selectedConfigType]);

  const executeDelete = useCallback(async () => {
    if (!state.deleteIntent) {
      return;
    }

    try {
      if (state.deleteIntent.entity === 'server') {
        await deleteServer(state.deleteIntent.name);
        pushNotice(`Server '${state.deleteIntent.name}' deleted`, 'success');
        await refresh();
        dispatch({ type: 'setScreen', screen: 'config-servers' });
      } else {
        await deleteServerType(state.deleteIntent.name);
        pushNotice(`Server type '${state.deleteIntent.name}' deleted`, 'success');
        dispatch({ type: 'setScreen', screen: 'config-types' });
      }
    } catch (deleteError) {
      pushNotice(deleteError instanceof Error ? deleteError.message : 'Delete failed', 'error');
      dispatch({ type: 'setScreen', screen: state.deleteIntent.entity === 'server' ? 'config-servers' : 'config-types' });
    } finally {
      dispatch({ type: 'setDeleteIntent', intent: undefined });
    }
  }, [state.deleteIntent, deleteServer, deleteServerType, refresh, pushNotice]);

  const cancelDelete = useCallback(() => {
    if (!state.deleteIntent) {
      dispatch({ type: 'setScreen', screen: 'config-home' });
      return;
    }

    dispatch({ type: 'setDeleteIntent', intent: undefined });
    dispatch({ type: 'setScreen', screen: state.deleteIntent.entity === 'server' ? 'config-servers' : 'config-types' });
  }, [state.deleteIntent]);

  useInput((input, key) => {
    const screen = state.screen;

    if (state.commandMode) {
      if (key.escape) {
        dispatch({ type: 'toggleCommandMode' });
        return;
      }

      if (key.return) {
        // Execute command
        if (state.command.trim()) {
          // For now, just show notice
          pushNotice(`Executed: ${state.command}`, 'info');
        }
        dispatch({ type: 'setCommand', command: '' });
        dispatch({ type: 'toggleCommandMode' });
        return;
      }

      if (key.backspace) {
        dispatch({ type: 'setCommand', command: state.command.slice(0, -1) });
        return;
      }

      if (input.length === 1) {
        dispatch({ type: 'setCommand', command: `${state.command}${input}` });
      }

      return;
    }

    if (screen === 'overview') {
      if (state.processing) {
        return;
      }

      if (input === 'q') {
        exit();
        return;
      }

      if (input === '/') {
        dispatch({ type: 'toggleCommandMode' });
        return;
      }

      if (key.upArrow || key.downArrow) {
        if (servers.length === 0) {
          return;
        }

        const currentIndex = selectedServer ? servers.findIndex((server) => server.name === selectedServer.name) : 0;
        const nextIndex = key.upArrow
          ? Math.max(0, currentIndex - 1)
          : Math.min(servers.length - 1, currentIndex + 1);
        dispatch({ type: 'setSelectedServerName', name: servers[nextIndex]?.name });
        return;
      }

      if (input === 's') {
        void startSelectedServer();
        return;
      }

      if (input === 'x') {
        void stopSelectedServer();
        return;
      }

      if (input === 'r') {
        void restartSelectedServer();
        return;
      }

      if (input === 'b') {
        void backupSelectedServer();
        return;
      }

      if (input === 'c') {
        void openConsole();
        return;
      }

      if (input === 'e') {
        void openConfigHome();
        return;
      }

      if (key.return) {
        void refresh();
        pushNotice('Status refresh requested', 'info', 1200);
      }

      return;
    }

    if (screen === 'config-home') {
      if (input === '1') {
        dispatch({ type: 'setScreen', screen: 'config-servers' });
        return;
      }

      if (input === '2') {
        dispatch({ type: 'setScreen', screen: 'config-types' });
        return;
      }

      if (key.escape) {
        dispatch({ type: 'setScreen', screen: 'overview' });
      }

      return;
    }

    if (screen === 'config-servers') {
      if (key.upArrow) {
        dispatch({ type: 'setSelectedConfigServer', index: Math.max(0, state.selectedConfigServer - 1) });
        return;
      }

      if (key.downArrow) {
        dispatch({
          type: 'setSelectedConfigServer',
          index: Math.min(Math.max(0, configServerNames.length - 1), state.selectedConfigServer + 1),
        });
        return;
      }

      if (input === 'a') {
        openServerEditor(true);
        return;
      }

      if (input === 'e' || key.return) {
        if (configServerNames.length > 0) {
          openServerEditor(false);
        }
        return;
      }

      if (input === 'd') {
        requestDeleteServer();
        return;
      }

      if (key.escape) {
        dispatch({ type: 'setScreen', screen: 'config-home' });
      }

      return;
    }

    if (screen === 'config-types') {
      if (key.upArrow) {
        dispatch({ type: 'setSelectedConfigType', index: Math.max(0, state.selectedConfigType - 1) });
        return;
      }

      if (key.downArrow) {
        dispatch({
          type: 'setSelectedConfigType',
          index: Math.min(Math.max(0, configTypeNames.length - 1), state.selectedConfigType + 1),
        });
        return;
      }

      if (input === 'a') {
        openTypeEditor(true);
        return;
      }

      if (input === 'e' || key.return) {
        if (configTypeNames.length > 0) {
          openTypeEditor(false);
        }
        return;
      }

      if (input === 'd') {
        requestDeleteType();
        return;
      }

      if (key.escape) {
        dispatch({ type: 'setScreen', screen: 'config-home' });
      }

      return;
    }

    if (screen === 'config-server-editor' && state.serverEditor) {
      const model = state.serverEditor;
      const fieldCount = model.isNew ? 4 : 3;

      if (key.escape) {
        dispatch({ type: 'clearServerEditor' });
        dispatch({ type: 'setScreen', screen: 'config-servers' });
        setEditorError(undefined);
        return;
      }

      if (key.ctrl && input === 's') {
        void saveServerEditor();
        return;
      }

      if (key.tab && !key.shift) {
        dispatch({ type: 'updateServerEditor', patch: { focus: (model.focus + 1) % fieldCount } });
        return;
      }

      if (key.tab && key.shift) {
        dispatch({ type: 'updateServerEditor', patch: { focus: (model.focus - 1 + fieldCount) % fieldCount } });
        return;
      }

      if (key.upArrow || key.downArrow) {
        if (model.isNew && model.focus === 1) {
          const current = configTypeNames.indexOf(model.type);
          const fallbackIndex = current >= 0 ? current : 0;
          const next = key.upArrow
            ? Math.max(0, fallbackIndex - 1)
            : Math.min(Math.max(0, configTypeNames.length - 1), fallbackIndex + 1);
          const nextType = configTypeNames[next];
          if (nextType) {
            dispatch({ type: 'updateServerEditor', patch: { type: nextType } });
          }
          return;
        }

        if (!model.isNew && model.focus === 0) {
          const current = configTypeNames.indexOf(model.type);
          const fallbackIndex = current >= 0 ? current : 0;
          const next = key.upArrow
            ? Math.max(0, fallbackIndex - 1)
            : Math.min(Math.max(0, configTypeNames.length - 1), fallbackIndex + 1);
          const nextType = configTypeNames[next];
          if (nextType) {
            dispatch({ type: 'updateServerEditor', patch: { type: nextType } });
          }
          return;
        }

        return;
      }

      if (key.backspace || key.delete) {
        if (model.isNew) {
          if (model.focus === 0) {
            dispatch({ type: 'updateServerEditor', patch: { name: model.name.slice(0, -1) } });
            return;
          }
          if (model.focus === 2) {
            dispatch({ type: 'updateServerEditor', patch: { path: model.path.slice(0, -1) } });
            return;
          }
          if (model.focus === 3) {
            dispatch({ type: 'updateServerEditor', patch: { port: model.port.slice(0, -1) } });
            return;
          }
        } else {
          if (model.focus === 1) {
            dispatch({ type: 'updateServerEditor', patch: { path: model.path.slice(0, -1) } });
            return;
          }
          if (model.focus === 2) {
            dispatch({ type: 'updateServerEditor', patch: { port: model.port.slice(0, -1) } });
            return;
          }
        }

        return;
      }

      if (input.length === 1 && !key.ctrl && !key.meta && !key.escape && !key.tab) {
        const text = input;

        if (model.isNew) {
          if (model.focus === 0) {
            dispatch({ type: 'updateServerEditor', patch: { name: `${model.name}${text}` } });
            return;
          }
          if (model.focus === 2) {
            dispatch({ type: 'updateServerEditor', patch: { path: `${model.path}${text}` } });
            return;
          }
          if (model.focus === 3) {
            if (/^[0-9]$/.test(text)) {
              dispatch({ type: 'updateServerEditor', patch: { port: `${model.port}${text}` } });
            }
            return;
          }
        } else {
          if (model.focus === 1) {
            dispatch({ type: 'updateServerEditor', patch: { path: `${model.path}${text}` } });
            return;
          }
          if (model.focus === 2) {
            if (/^[0-9]$/.test(text)) {
              dispatch({ type: 'updateServerEditor', patch: { port: `${model.port}${text}` } });
            }
            return;
          }
        }
      }

      return;
    }

    if (screen === 'config-type-editor' && state.typeEditor) {
      const model = state.typeEditor;
      const fieldCount = model.isNew ? 4 : 3;

      if (key.escape) {
        dispatch({ type: 'clearTypeEditor' });
        dispatch({ type: 'setScreen', screen: 'config-types' });
        setEditorError(undefined);
        return;
      }

      if (key.ctrl && input === 's') {
        void saveTypeEditor();
        return;
      }

      if (key.tab && !key.shift) {
        dispatch({ type: 'updateTypeEditor', patch: { focus: (model.focus + 1) % fieldCount } });
        return;
      }

      if (key.tab && key.shift) {
        dispatch({ type: 'updateTypeEditor', patch: { focus: (model.focus - 1 + fieldCount) % fieldCount } });
        return;
      }

      if (key.backspace || key.delete) {
        if (model.isNew) {
          if (model.focus === 0) {
            dispatch({ type: 'updateTypeEditor', patch: { name: model.name.slice(0, -1) } });
            return;
          }
          if (model.focus === 1) {
            dispatch({ type: 'updateTypeEditor', patch: { memory: model.memory.slice(0, -1) } });
            return;
          }
          if (model.focus === 2) {
            dispatch({ type: 'updateTypeEditor', patch: { minMemory: model.minMemory.slice(0, -1) } });
            return;
          }
          if (model.focus === 3) {
            dispatch({ type: 'updateTypeEditor', patch: { jvmFlags: model.jvmFlags.slice(0, -1) } });
            return;
          }
        } else {
          if (model.focus === 0) {
            dispatch({ type: 'updateTypeEditor', patch: { memory: model.memory.slice(0, -1) } });
            return;
          }
          if (model.focus === 1) {
            dispatch({ type: 'updateTypeEditor', patch: { minMemory: model.minMemory.slice(0, -1) } });
            return;
          }
          if (model.focus === 2) {
            dispatch({ type: 'updateTypeEditor', patch: { jvmFlags: model.jvmFlags.slice(0, -1) } });
            return;
          }
        }

        return;
      }

      if (input.length === 1 && !key.ctrl && !key.meta && !key.escape && !key.tab) {
        const text = input;

        if (model.isNew) {
          if (model.focus === 0) {
            dispatch({ type: 'updateTypeEditor', patch: { name: `${model.name}${text}` } });
            return;
          }
          if (model.focus === 1) {
            dispatch({ type: 'updateTypeEditor', patch: { memory: `${model.memory}${text}` } });
            return;
          }
          if (model.focus === 2) {
            dispatch({ type: 'updateTypeEditor', patch: { minMemory: `${model.minMemory}${text}` } });
            return;
          }
          if (model.focus === 3) {
            dispatch({ type: 'updateTypeEditor', patch: { jvmFlags: `${model.jvmFlags}${text}` } });
            return;
          }
        } else {
          if (model.focus === 0) {
            dispatch({ type: 'updateTypeEditor', patch: { memory: `${model.memory}${text}` } });
            return;
          }
          if (model.focus === 1) {
            dispatch({ type: 'updateTypeEditor', patch: { minMemory: `${model.minMemory}${text}` } });
            return;
          }
          if (model.focus === 2) {
            dispatch({ type: 'updateTypeEditor', patch: { jvmFlags: `${model.jvmFlags}${text}` } });
            return;
          }
        }
      }

      return;
    }

    if (screen === 'confirm-delete') {
      if (input.toLowerCase() === 'y') {
        void executeDelete();
        return;
      }

      if (input.toLowerCase() === 'n' || key.escape) {
        cancelDelete();
      }
    }
  });

  useEffect(() => {
    if (state.screen === 'config-servers') {
      const bounded = firstServerName(configServerNames, state.selectedConfigServer);
      if (bounded !== state.selectedConfigServer) {
        dispatch({ type: 'setSelectedConfigServer', index: bounded });
      }
    }

    if (state.screen === 'config-types') {
      const bounded = firstServerName(configTypeNames, state.selectedConfigType);
      if (bounded !== state.selectedConfigType) {
        dispatch({ type: 'setSelectedConfigType', index: bounded });
      }
    }
  }, [configServerNames, configTypeNames, state.screen, state.selectedConfigServer, state.selectedConfigType]);

  const configPath = configService.getConfigPath();

  const screenTitle = useMemo(() => {
    const titleMap: Record<Screen, string> = {
      overview: 'Server Deck',
      'config-home': 'Config Studio',
      'config-servers': 'Server Registry',
      'config-server-editor': 'Server Editor',
      'config-types': 'Type Library',
      'config-type-editor': 'Type Editor',
      'confirm-delete': 'Confirm Delete',
    };

    return titleMap[state.screen];
  }, [state.screen]);

  return (
    <Box flexDirection="column" padding={1}>
      {state.screen === 'overview' ? (
        <>
          <StatusBar
            servers={servers}
            selectedServerName={selectedServer?.name}
            processing={state.processing}
            lastUpdated={lastUpdated}
          />

          <Box flexDirection="row" marginTop={1}>
            <Box width="30%" borderStyle="single" borderColor="gray">
              <ServerSidebar servers={servers} selectedName={selectedServer?.name} />
            </Box>
            <Box width="70%" borderStyle="single" borderColor="gray" marginLeft={1}>
              <ServerDetailsPanel server={selectedServer} />
            </Box>
          </Box>

          <Box marginTop={1}>
            <NoticeStrip notice={state.notice} idleText="Ready. Use arrow keys to navigate, / to enter command mode." />
          </Box>

          <Box marginTop={1}>
            <ShortcutStrip
              items={[
                { key: '↑↓', label: 'Navigate servers' },
                { key: 'S', label: 'Start' },
                { key: 'X', label: 'Stop' },
                { key: 'R', label: 'Restart' },
                { key: 'B', label: 'Backup' },
                { key: 'C', label: 'Console' },
                { key: 'E', label: 'Config' },
                { key: '/', label: 'Command mode' },
                { key: 'Enter', label: 'Refresh' },
                { key: 'Q', label: 'Quit' },
              ]}
            />
          </Box>

          <Box marginTop={1}>
            <CommandBar command={state.command} />
          </Box>
        </>
      ) : (
        <>
          <Box borderStyle="doubleSingle" borderColor="yellowBright" paddingX={1}>
            <Text>
              <Text color="yellowBright" bold>MC-CLI COMMAND DECK</Text>
              <Text color="gray"> | </Text>
              <Text color="whiteBright">{screenTitle}</Text>
              <Text color="gray"> | </Text>
              <Text color="gray" wrap="truncate-end">{configPath}</Text>
            </Text>
          </Box>

          <Box marginTop={1}>
            {state.screen === 'config-home' ? (
              <ConfigHomeScreen
                serverCount={configServerNames.length}
                typeCount={configTypeNames.length}
                notice={state.notice}
              />
            ) : null}

            {state.screen === 'config-servers' ? (
              <ConfigServersScreen
                servers={configServers}
                selectedIndex={state.selectedConfigServer}
                notice={state.notice}
              />
            ) : null}

            {state.screen === 'config-types' ? (
              <ConfigTypesScreen
                types={serverTypes}
                selectedIndex={state.selectedConfigType}
                notice={state.notice}
              />
            ) : null}

            {state.screen === 'config-server-editor' && state.serverEditor ? (
              <ServerEditorScreen model={state.serverEditor} notice={state.notice} error={editorError} />
            ) : null}

            {state.screen === 'config-type-editor' && state.typeEditor ? (
              <TypeEditorScreen model={state.typeEditor} notice={state.notice} error={editorError} />
            ) : null}

            {state.screen === 'confirm-delete' && state.deleteIntent ? (
              <ConfirmDeleteScreen intent={state.deleteIntent} notice={state.notice} />
            ) : null}
          </Box>
        </>
      )}
    </Box>
  );
};

export function renderDashboard(): void {
  render(<DashboardRoot />);
}
