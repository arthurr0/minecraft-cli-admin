import React from 'react';
import { Box } from 'ink';
import type { ServerConfig } from '../../types/config.js';
import type { Notice } from '../core/types.js';
import { Panel, NoticeStrip, ShortcutStrip, ConfigList } from '../primitives/index.js';

export interface ConfigServersScreenProps {
  servers: Record<string, ServerConfig>;
  selectedIndex: number;
  notice?: Notice;
}

export function ConfigServersScreen({
  servers,
  selectedIndex,
  notice,
}: ConfigServersScreenProps): React.ReactElement {
  const names = Object.keys(servers);
  const items = names.map((name) => ({
    name,
    secondary: servers[name].type,
    tertiary: servers[name].port ? String(servers[name].port) : '-',
  }));

  return (
    <Box flexDirection="column">
      <Panel title="Config Studio / Server Registry" tone="accent">
        <ConfigList
          title="Servers"
          emptyText="No servers configured."
          items={items}
          selectedIndex={selectedIndex}
          columns={['NAME', 'TYPE', 'PORT']}
        />
      </Panel>

      <Box marginTop={1}>
        <NoticeStrip notice={notice} idleText="Manage server entries." />
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
