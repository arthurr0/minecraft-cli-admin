import React from 'react';
import { Box } from 'ink';
import type { ServerTypeConfig } from '../../types/config.js';
import type { Notice } from '../core/types.js';
import { Panel, NoticeStrip, ShortcutStrip, ConfigList } from '../primitives/index.js';

export interface ConfigTypesScreenProps {
  types: Record<string, ServerTypeConfig>;
  selectedIndex: number;
  notice?: Notice;
}

export function ConfigTypesScreen({
  types,
  selectedIndex,
  notice,
}: ConfigTypesScreenProps): React.ReactElement {
  const names = Object.keys(types);
  const items = names.map((name) => ({
    name,
    secondary: types[name].memory,
    tertiary: `${types[name].jvm_flags.length} flags`,
  }));

  return (
    <Box flexDirection="column">
      <Panel title="Config Studio / Type Library" tone="accent">
        <ConfigList
          title="Server Types"
          emptyText="No server types configured."
          items={items}
          selectedIndex={selectedIndex}
          columns={['NAME', 'MEMORY', 'FLAGS']}
        />
      </Panel>

      <Box marginTop={1}>
        <NoticeStrip notice={notice} idleText="Manage server type profiles." />
      </Box>

      <Box marginTop={1}>
        <ShortcutStrip
          items={[
            { key: '↑/↓', label: 'Select row' },
            { key: 'A', label: 'Add' },
            { key: 'E/Enter', label: 'Edit' },
            { key: 'D', label: 'Delete' },
            { key: 'ESC', label: 'Back' },
          ]}
        />
      </Box>
    </Box>
  );
}
