import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import type { ServerInfo } from '../../types/server.js';

export interface StatusBarProps {
  servers: ServerInfo[];
  selectedServerName?: string;
  processing: boolean;
  lastUpdated?: string;
}

export const StatusBar = React.memo(function StatusBar({
  servers,
  selectedServerName,
  processing,
  lastUpdated,
}: StatusBarProps): React.ReactElement {
  const runningServers = useMemo(
    () => servers.filter((server) => server.status === 'running').length,
    [servers]
  );

  return (
    <Box borderStyle="doubleSingle" borderColor="yellowBright" paddingX={1}>
      <Text>
        <Text color="yellowBright" bold>MC-CLI DASHBOARD</Text>
        <Text color="gray"> | </Text>
        <Text color="whiteBright">{servers.length} servers</Text>
        <Text color="gray"> | </Text>
        <Text color="greenBright">{runningServers} running</Text>
        <Text color="gray"> | </Text>
        <Text color="yellowBright">focus: {selectedServerName ?? 'none'}</Text>
        <Text color="gray"> | </Text>
        <Text color={processing ? 'yellowBright' : 'greenBright'}>{processing ? 'busy' : 'ready'}</Text>
        <Text color="gray"> | </Text>
        <Text>sync: {lastUpdated ?? '--:--:--'}</Text>
      </Text>
    </Box>
  );
});