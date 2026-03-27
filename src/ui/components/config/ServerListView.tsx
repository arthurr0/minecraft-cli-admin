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
      <Box borderStyle="singleDouble" borderColor="greenBright" paddingX={1}>
        <Text color="greenBright" bold>Instance Registry</Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Box marginBottom={1}>
          <Text color="gray" bold>
            {'  INSTANCE'.padEnd(22)}{'PROFILE'.padEnd(20)}{'PATH'.padEnd(32)}PORT
          </Text>
        </Box>

        {serverNames.length === 0 ? (
          <Box>
            <Text color="gray" italic>  No instances configured</Text>
          </Box>
        ) : (
          serverNames.map((name, index) => {
            const server = servers[name];
            const isSelected = index === selectedIndex;
            return (
              <Box key={name}>
                <Text color={isSelected ? 'black' : 'white'} bold={isSelected} inverse={isSelected}>
                  {isSelected ? '> ' : '  '}
                  {name.padEnd(20)}
                  {server.type.padEnd(20)}
                  {(server.path.length > 30 ? server.path.slice(0, 27) + '...' : server.path).padEnd(32)}
                  {server.port || '-'}
                </Text>
              </Box>
            );
          })
        )}
      </Box>

      <Box marginTop={1} borderStyle="single" borderColor="yellowBright" paddingX={1}>
        <Text color="gray">
          [A] Add  [E]/[Enter] Edit  [D] Delete  [Esc] Back
        </Text>
      </Box>
    </Box>
  );
};
