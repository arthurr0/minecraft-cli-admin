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
  const names = Object.keys(servers);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(i => Math.max(0, i - 1));
      return;
    }

    if (key.downArrow) {
      setSelectedIndex(i => Math.min(names.length - 1, i + 1));
      return;
    }

    if (key.return || input === 'e') {
      if (names.length > 0) {
        onEdit(names[selectedIndex]);
      }
      return;
    }

    if (input === 'a') {
      onAdd();
      return;
    }

    if (input === 'd') {
      if (names.length > 0) {
        onDelete(names[selectedIndex]);
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
      <Box borderStyle="doubleSingle" borderColor="greenBright" paddingX={1}>
        <Text color="greenBright" bold>INSTANCE REGISTRY</Text>
      </Box>

      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column">
        <Text color="gray" bold>
          {'  INSTANCE'.padEnd(24)}
          {'PROFILE'.padEnd(20)}
          PORT
        </Text>

        <Text color="gray">{'─'.repeat(58)}</Text>

        {names.length === 0 ? (
          <Text color="gray">NO INSTANCES CONFIGURED</Text>
        ) : (
          names.map((name, index) => {
            const instance = servers[name];
            const selected = selectedIndex === index;
            return (
              <Text key={name} color={selected ? 'black' : 'white'} inverse={selected} bold={selected}>
                {selected ? '▶ ' : '  '}
                {name.padEnd(22)}
                {instance.type.padEnd(20)}
                {instance.port || '-'}
              </Text>
            );
          })
        )}
      </Box>

      <Box marginTop={1} borderStyle="doubleSingle" borderColor="yellowBright" paddingX={1}>
        <Text color="gray">[A] ADD  [E]/[ENTER] EDIT  [D] DELETE  [ESC] BACK</Text>
      </Box>
    </Box>
  );
};
