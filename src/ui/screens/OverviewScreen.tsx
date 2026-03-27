import React from 'react';
import { Box, Text } from 'ink';
import type { ServerInfo } from '../../types/server.js';
import type { EventRecord, Notice } from '../core/types.js';
import {
  Panel,
  ServerList,
  ServerDetails,
  EventFeed,
  LogTail,
  NoticeStrip,
  ShortcutStrip,
} from '../primitives/index.js';

export interface OverviewScreenProps {
  servers: ServerInfo[];
  selectedServer?: ServerInfo;
  selectedServerName?: string;
  events: EventRecord[];
  logs: string[];
  notice?: Notice;
  isLoading: boolean;
  error?: string | null;
  processing: boolean;
  runningServers: number;
  lastUpdated?: string;
  compact: boolean;
}

export function OverviewScreen({
  servers,
  selectedServer,
  selectedServerName,
  events,
  logs,
  notice,
  isLoading,
  error,
  processing,
  runningServers,
  lastUpdated,
  compact,
}: OverviewScreenProps): React.ReactElement {
  const stopped = Math.max(0, servers.length - runningServers);

  return (
    <Box flexDirection="column">
      <Panel title="Mission Control" tone="accent">
        <Text>
          <Text color="cyanBright" bold>fleet</Text>
          <Text color="gray"> </Text>
          <Text>{servers.length}</Text>
          <Text color="gray"> | </Text>
          <Text color="greenBright" bold>running</Text>
          <Text color="gray"> </Text>
          <Text>{runningServers}</Text>
          <Text color="gray"> | </Text>
          <Text color="redBright" bold>stopped</Text>
          <Text color="gray"> </Text>
          <Text>{stopped}</Text>
          <Text color="gray"> | </Text>
          <Text color={processing ? 'yellowBright' : 'greenBright'}>{processing ? 'pipeline busy' : 'pipeline ready'}</Text>
          <Text color="gray"> | updated {lastUpdated ?? '--:--:--'}</Text>
        </Text>
      </Panel>

      {error ? (
        <Panel title="Status" tone="danger" marginTop={1}>
          <Text color="redBright">{error}</Text>
        </Panel>
      ) : null}

      {isLoading && servers.length === 0 ? (
        <Panel title="Fleet" tone="warning" marginTop={1}>
          <Text color="yellowBright">Loading server status...</Text>
        </Panel>
      ) : (
        <Box flexDirection={compact ? 'column' : 'row'} alignItems="flex-start" marginTop={1}>
          <Panel title="Fleet" tone="success" width={compact ? '100%' : '62%'}>
            <ServerList servers={servers} selectedName={selectedServerName} narrow={compact} />
          </Panel>

          <Panel title="Selected Server" tone="neutral" width={compact ? '100%' : '38%'} marginTop={compact ? 1 : 0}>
            <ServerDetails server={selectedServer} processing={processing} />
          </Panel>
        </Box>
      )}

      <Box flexDirection={compact ? 'column' : 'row'} alignItems="flex-start" marginTop={1}>
        <Panel title="Event Stream" tone="accent" width={compact ? '100%' : '50%'}>
          <EventFeed events={events} />
        </Panel>

        <Panel title="Live Log Tail" tone="warning" width={compact ? '100%' : '50%'} marginTop={compact ? 1 : 0}>
          <LogTail serverName={selectedServer?.name} lines={logs} />
        </Panel>
      </Box>

      <Box marginTop={1}>
        <NoticeStrip notice={notice} />
      </Box>

      <Box marginTop={1}>
        <ShortcutStrip
          items={[
            { key: '↑/↓', label: 'Select server' },
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
