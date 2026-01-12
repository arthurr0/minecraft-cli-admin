import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { ServerConfig } from '../../../types/config.js';

export interface ServerListViewProps {
  servers: Record<string, ServerConfig>;
  onAdd: () => void;
  onEdit: (name: string) => void;
  onDelete: (name: string) => void;
  onBack: () => void;
}

export const ServerListView: React.FC<ServerListViewProps> = ({
  servers,
  onAdd,
  onEdit,
  onDelete,
  onBack,
}) => {
  const serverNames = Object.keys(servers);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(i => Math.max(0, i - 1));
      return;
    }

    if (key.downArrow) {
      setSelectedIndex(i => Math.min(serverNames.length - 1, i + 1));
      return;
    }

    if (key.return || input === 'e') {
      if (serverNames.length > 0) {
        onEdit(serverNames[selectedIndex]);
      }
      return;
    }

    if (input === 'a') {
      onAdd();
      return;
    }

    if (input === 'd') {
      if (serverNames.length > 0) {
        onDelete(serverNames[selectedIndex]);
      }
      return;
    }

    if (key.escape) {
      onBack();
      return;
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="single" borderColor="cyan" paddingX={1}>
        <Text color="cyan" bold>Servers</Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Box marginBottom={1}>
          <Text color="gray" bold>
            {'  NAME'.padEnd(20)}{'TYPE'.padEnd(20)}{'PATH'.padEnd(30)}PORT
          </Text>
        </Box>

        {serverNames.length === 0 ? (
          <Box>
            <Text color="gray" italic>  No servers configured</Text>
          </Box>
        ) : (
          serverNames.map((name, index) => {
            const server = servers[name];
            const isSelected = index === selectedIndex;
            return (
              <Box key={name}>
                <Text color={isSelected ? 'cyan' : 'white'} bold={isSelected}>
                  {isSelected ? '> ' : '  '}
                  {name.padEnd(18)}
                  {server.type.padEnd(20)}
                  {(server.path.length > 28 ? server.path.slice(0, 25) + '...' : server.path).padEnd(30)}
                  {server.port || '-'}
                </Text>
              </Box>
            );
          })
        )}
      </Box>

      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray">
          a=add  e/Enter=edit  d=delete  Esc=back
        </Text>
      </Box>
    </Box>
  );
};
