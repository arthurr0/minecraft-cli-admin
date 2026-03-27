import React from 'react';
import { Box, Text } from 'ink';
import type { ServerInfo } from '../../types/server.js';
import type { Notice } from '../core/types.js';
import {
  Panel,
  ServerList,
  NoticeStrip,
  ShortcutStrip,
} from '../primitives/index.js';

export interface OverviewScreenProps {
  servers: ServerInfo[];
  selectedServerName?: string;
  notice?: Notice;
  isLoading: boolean;
  error?: string | null;
  processing: boolean;
  runningServers: number;
  lastUpdated?: string;
  columns: number;
}

export function OverviewScreen({
  servers,
  selectedServerName,
  notice,
  isLoading,
  error,
  processing,
  runningServers,
  lastUpdated,
  columns,
}: OverviewScreenProps): React.ReactElement {
  const stopped = Math.max(0, servers.length - runningServers);

  return (
    <Box flexDirection="column">
      <Panel title="Server Deck" tone="accent">
        <Text wrap="truncate-end">
          <Text color="gray">nodes </Text>
          <Text color="whiteBright" bold>{servers.length}</Text>
          <Text color="gray">  |  live </Text>
          <Text color="greenBright" bold>{runningServers}</Text>
          <Text color="gray">  |  halted </Text>
          <Text color="redBright" bold>{stopped}</Text>
          <Text color="gray">  |  focus </Text>
          <Text color="cyanBright" bold>{selectedServerName ?? 'none'}</Text>
          <Text color="gray">  |  pipeline </Text>
          <Text color={processing ? 'yellowBright' : 'greenBright'}>{processing ? 'busy' : 'ready'}</Text>
          <Text color="gray">  |  sync </Text>
          <Text>{lastUpdated ?? '--:--:--'}</Text>
        </Text>
        <Text color="gray" wrap="truncate-end">
          Every server stays in view as its own tile with the core runtime stats.
        </Text>
      </Panel>

      {error ? (
        <Panel title="Status Fault" tone="danger" marginTop={1}>
          <Text color="redBright">{error}</Text>
        </Panel>
      ) : null}

      {isLoading && servers.length === 0 ? (
        <Panel title="Boot Sequence" tone="warning" marginTop={1}>
          <Text color="yellowBright">Loading server tiles...</Text>
        </Panel>
      ) : servers.length === 0 ? (
        <Panel title="Empty Deck" tone="warning" marginTop={1}>
          <Text color="yellowBright">No servers configured yet.</Text>
        </Panel>
      ) : (
        <Box marginTop={1}>
          <ServerList servers={servers} selectedName={selectedServerName} columns={columns} />
        </Box>
      )}

      <Box marginTop={1}>
        <NoticeStrip notice={notice} idleText="Ready. Move between tiles and run an action on the focused server." />
      </Box>

      <Box marginTop={1}>
        <ShortcutStrip
          items={[
            { key: 'Arrows', label: 'Move focus' },
            { key: 'S', label: 'Start' },
            { key: 'X', label: 'Stop' },
            { key: 'R', label: 'Restart' },
            { key: 'B', label: 'Backup' },
            { key: 'C', label: 'Console' },
            { key: 'E', label: 'Config studio' },
            { key: 'Enter', label: 'Refresh' },
            { key: 'Q', label: 'Quit' },
          ]}
        />
      </Box>
    </Box>
  );
}
