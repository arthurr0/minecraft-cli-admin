import React from 'react';
import { Box, Text } from 'ink';
import type { Notice } from '../core/types.js';
import { Panel, NoticeStrip, ShortcutStrip } from '../primitives/index.js';

export interface ConfigHomeScreenProps {
  serverCount: number;
  typeCount: number;
  notice?: Notice;
}

export function ConfigHomeScreen({ serverCount, typeCount, notice }: ConfigHomeScreenProps): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Panel title="Config Studio" tone="accent">
        <Box flexDirection="column">
          <Text>
            <Text color="yellowBright" bold>1.</Text>
            <Text> Server registry </Text>
            <Text color="gray">({serverCount} entries)</Text>
          </Text>
          <Text>
            <Text color="yellowBright" bold>2.</Text>
            <Text> Type library </Text>
            <Text color="gray">({typeCount} profiles)</Text>
          </Text>
          <Box marginTop={1}>
            <Text color="gray">Press 1 or 2 to open a section, or ESC to return.</Text>
          </Box>
        </Box>
      </Panel>

      <Box marginTop={1}>
        <NoticeStrip notice={notice} idleText="Config studio ready." />
      </Box>

      <Box marginTop={1}>
        <ShortcutStrip
          items={[
            { key: '1', label: 'Servers' },
            { key: '2', label: 'Types' },
            { key: 'ESC', label: 'Back to dashboard' },
          ]}
        />
      </Box>
    </Box>
  );
}
