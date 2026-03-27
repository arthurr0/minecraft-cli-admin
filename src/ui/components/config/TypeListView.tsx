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
  const typeNames = Object.keys(types);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(i => Math.max(0, i - 1));
      return;
    }

    if (key.downArrow) {
      setSelectedIndex(i => Math.min(typeNames.length - 1, i + 1));
      return;
    }

    if (key.return || input === 'e') {
      if (typeNames.length > 0) {
        onEdit(typeNames[selectedIndex]);
      }
      return;
    }

    if (input === 'a') {
      onAdd();
      return;
    }

    if (input === 'd') {
      if (typeNames.length > 0) {
        onDelete(typeNames[selectedIndex]);
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
        <Text color="greenBright" bold>Profile Library</Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Box marginBottom={1}>
          <Text color="gray" bold>
            {'  PROFILE'.padEnd(25)}{'MEMORY'.padEnd(12)}{'MIN'.padEnd(12)}FLAGS
          </Text>
        </Box>

        {typeNames.length === 0 ? (
          <Box>
            <Text color="gray" italic>  No profiles configured</Text>
          </Box>
        ) : (
          typeNames.map((name, index) => {
            const type = types[name];
            const isSelected = index === selectedIndex;
            return (
              <Box key={name}>
                <Text color={isSelected ? 'black' : 'white'} bold={isSelected} inverse={isSelected}>
                  {isSelected ? '> ' : '  '}
                  {name.padEnd(23)}
                  {type.memory.padEnd(12)}
                  {type.min_memory.padEnd(12)}
                  {type.jvm_flags.length} flags
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
