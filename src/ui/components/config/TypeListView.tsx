import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { ServerTypeConfig } from '../../../types/config.js';

export interface TypeListViewProps {
  types: Record<string, ServerTypeConfig>;
  onAdd: () => void;
  onEdit: (name: string) => void;
  onDelete: (name: string) => void;
  onBack: () => void;
}

export const TypeListView: React.FC<TypeListViewProps> = ({
  types,
  onAdd,
  onEdit,
  onDelete,
  onBack,
}) => {
  const names = Object.keys(types);
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
        <Text color="greenBright" bold>PROFILE LIBRARY</Text>
      </Box>

      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column">
        <Text color="gray" bold>
          {'  PROFILE'.padEnd(24)}
          {'MEM'.padEnd(12)}
          {'MIN'.padEnd(12)}
          FLAGS
        </Text>

        <Text color="gray">{'─'.repeat(58)}</Text>

        {names.length === 0 ? (
          <Text color="gray">NO PROFILES CONFIGURED</Text>
        ) : (
          names.map((name, index) => {
            const type = types[name];
            const selected = selectedIndex === index;
            return (
              <Text key={name} color={selected ? 'black' : 'white'} inverse={selected} bold={selected}>
                {selected ? '▶ ' : '  '}
                {name.padEnd(22)}
                {type.memory.padEnd(12)}
                {type.min_memory.padEnd(12)}
                {type.jvm_flags.length}
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
