import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { OverviewScreen } from './OverviewScreen.js';
import type { ServerInfo } from '../../types/server.js';

const servers: ServerInfo[] = [
  {
    name: 'survival',
    status: 'running',
    pid: 123,
    uptime: '2h',
    memoryMB: 1500,
    cpuPercent: 18,
    portInUse: true,
    config: {
      type: 'paper',
      path: '/srv/minecraft/survival',
      port: 25565,
    },
    typeConfig: {
      memory: '4G',
      min_memory: '2G',
      jvm_flags: ['-XX:+UseG1GC'],
    },
  },
];

describe('OverviewScreen', () => {
  it('renders fleet, details and event/log sections', () => {
    const { lastFrame } = render(
      <OverviewScreen
        servers={servers}
        selectedServer={servers[0]}
        selectedServerName="survival"
        events={[{ timestamp: '10:00:00', level: 'info', text: 'Refresh done' }]}
        logs={['[Server thread/INFO]: Done (1.2s)!']}
        notice={{ level: 'info', text: 'Ready' }}
        isLoading={false}
        error={null}
        processing={false}
        runningServers={1}
        lastUpdated="10:00:01"
        compact={false}
      />,
    );

    expect(lastFrame()).toContain('Mission Control');
    expect(lastFrame()).toContain('survival');
    expect(lastFrame()).toContain('Event Stream');
    expect(lastFrame()).toContain('Live Log Tail');
  });
});
