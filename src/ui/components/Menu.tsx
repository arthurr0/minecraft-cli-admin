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
      <Box borderStyle="single" borderColor="cyan" paddingX={1}>
        <Text color="cyan" bold>{title}</Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {items.map((item, index) => (
          <Box key={item.value} flexDirection="column">
            <Box>
              <Text
                color={index === selectedIndex ? 'cyan' : 'white'}
                bold={index === selectedIndex}
              >
                {index === selectedIndex ? '> ' : '  '}
                {item.label}
              </Text>
            </Box>
            {item.description && index === selectedIndex && (
              <Box marginLeft={4}>
                <Text color="gray">{item.description}</Text>
              </Box>
            )}
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text color="gray">
          {onBack ? 'Enter=select  Esc=back' : 'Enter=select'}
        </Text>
      </Box>
    </Box>
  );
};
