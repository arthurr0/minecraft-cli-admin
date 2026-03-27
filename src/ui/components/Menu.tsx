import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface MenuItem {
  label: string;
  value: string;
  description?: string;
}

export interface MenuProps {
  title: string;
  items: MenuItem[];
  onSelect: (value: string) => void;
  onBack?: () => void;
}

export const Menu: React.FC<MenuProps> = ({
  title,
  items,
  onSelect,
  onBack,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(i => Math.max(0, i - 1));
      return;
    }

    if (key.downArrow) {
      setSelectedIndex(i => Math.min(items.length - 1, i + 1));
      return;
    }

    if (key.return) {
      onSelect(items[selectedIndex].value);
      return;
    }

    if (key.escape && onBack) {
      onBack();
      return;
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="doubleSingle" borderColor="greenBright" paddingX={1}>
        <Text color="greenBright" bold>{title.toUpperCase()}</Text>
      </Box>

      <Box flexDirection="column" marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        {items.map((item, index) => {
          const selected = index === selectedIndex;
          return (
            <Box key={item.value} flexDirection="column" marginBottom={item.description && selected ? 1 : 0}>
              <Text color={selected ? 'black' : 'white'} inverse={selected} bold={selected}>
                {selected ? '▶ ' : '  '}
                {item.label}
              </Text>

              {item.description && selected && (
                <Text color="gray">   {item.description}</Text>
              )}
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1} borderStyle="doubleSingle" borderColor="yellowBright" paddingX={1}>
        <Text color="gray">{onBack ? '<ENTER> SELECT   <ESC> BACK' : '<ENTER> SELECT'}</Text>
      </Box>
    </Box>
  );
};
