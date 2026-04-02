import React from 'react';
import { Box, Text } from 'ink';

export interface ConfigListItem {
  name: string;
  secondary: string;
  tertiary?: string;
}

export interface ConfigListProps {
  title: string;
  emptyText: string;
  items: ConfigListItem[];
  selectedIndex: number;
  columns?: [string, string, string?];
}

export function ConfigList({
  title,
  emptyText,
  items,
  selectedIndex,
  columns,
}: ConfigListProps): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Text color="yellowBright" bold>{title}</Text>
      {columns ? (
        <Text color="gray" bold>
          {'  '}
          {columns[0].padEnd(24)}
          {columns[1].padEnd(20)}
          {columns[2] ?? ''}
        </Text>
      ) : null}
      <Text color="gray">{'-'.repeat(62)}</Text>

      {items.length === 0 ? (
        <Text color="gray">{emptyText}</Text>
      ) : (
        items.map((item, index) => {
          const selected = selectedIndex === index;
          return (
            <Text key={item.name} color={selected ? 'black' : 'white'} inverse={selected} bold={selected}>
              {selected ? '▶ ' : '  '}
              {item.name.padEnd(22)}
              {item.secondary.padEnd(20)}
              {item.tertiary ?? ''}
            </Text>
          );
        })
      )}
    </Box>
  );
}
