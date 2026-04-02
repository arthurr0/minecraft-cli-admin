import React from 'react';
import { Box, Text } from 'ink';

export interface ShortcutItem {
  key: string;
  label: string;
}

export interface ShortcutStripProps {
  items: ShortcutItem[];
}

export function ShortcutStrip({ items }: ShortcutStripProps): React.ReactElement {
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
      {items.map((item, index) => (
        <Text key={`${item.key}-${item.label}`}>
          <Text color="yellowBright" bold>{item.key}</Text>
          <Text color="gray"> {item.label}</Text>
          {index < items.length - 1 ? <Text color="gray">  |  </Text> : null}
        </Text>
      ))}
    </Box>
  );
}
