import React from 'react';
import { Box, Text } from 'ink';
import type { EventRecord } from '../core/types.js';

export interface EventFeedProps {
  events: EventRecord[];
}

function levelColor(level: EventRecord['level']): 'yellowBright' | 'greenBright' | 'redBright' {
  if (level === 'success') {
    return 'greenBright';
  }

  if (level === 'error') {
    return 'redBright';
  }

  return 'yellowBright';
}

export function EventFeed({ events }: EventFeedProps): React.ReactElement {
  if (events.length === 0) {
    return <Text color="gray">No events yet.</Text>;
  }

  return (
    <Box flexDirection="column">
      {events.map((event, index) => (
        <Text key={`${event.timestamp}-${index}`} wrap="truncate-end">
          <Text color="gray">[{event.timestamp}] </Text>
          <Text color={levelColor(event.level)}>{event.level.toUpperCase()}</Text>
          <Text color="gray">{' -> '}</Text>
          <Text>{event.text}</Text>
        </Text>
      ))}
    </Box>
  );
}
