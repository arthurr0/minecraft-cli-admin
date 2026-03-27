import React from 'react';
import { Box, Text } from 'ink';

export interface LogTailProps {
  serverName?: string;
  lines: string[];
  maxLines?: number;
}

export function LogTail({ serverName, lines, maxLines = 8 }: LogTailProps): React.ReactElement {
  if (!serverName) {
    return <Text color="gray">Select a server to view logs.</Text>;
  }

  if (lines.length === 0) {
    return <Text color="gray">No recent logs for {serverName}.</Text>;
  }

  const visible = lines.slice(-maxLines);

  return (
    <Box flexDirection="column">
      {visible.map((line, index) => (
        <Text key={`${serverName}-${index}`} wrap="truncate-end">
          <Text color="gray">{String(index + 1).padStart(2, '0')} | </Text>
          <Text>{line}</Text>
        </Text>
      ))}
    </Box>
  );
}
