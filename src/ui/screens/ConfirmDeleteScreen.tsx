import React from 'react';
import { Box, Text } from 'ink';
import type { DeleteIntent, Notice } from '../core/types.js';
import { Panel, NoticeStrip, ShortcutStrip } from '../primitives/index.js';

export interface ConfirmDeleteScreenProps {
  intent: DeleteIntent;
  notice?: Notice;
}

export function ConfirmDeleteScreen({ intent, notice }: ConfirmDeleteScreenProps): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Panel title="Confirm Delete" tone="danger">
        <Text>{intent.message}</Text>
        <Box marginTop={1}>
          <Text color="gray">Entity: {intent.entity} / Name: {intent.name}</Text>
        </Box>
      </Panel>

      <Box marginTop={1}>
        <NoticeStrip notice={notice} idleText="Confirm destructive action." />
      </Box>

      <Box marginTop={1}>
        <ShortcutStrip
          items={[
            { key: 'Y', label: 'Confirm delete' },
            { key: 'N', label: 'Cancel' },
            { key: 'ESC', label: 'Cancel' },
          ]}
        />
      </Box>
    </Box>
  );
}
