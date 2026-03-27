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
  it('renders the server deck as individual tiles', () => {
    const { lastFrame } = render(
      <OverviewScreen
        servers={servers}
        selectedServerName="survival"
        notice={{ level: 'info', text: 'Ready' }}
        isLoading={false}
        error={null}
        processing={false}
        runningServers={1}
        lastUpdated="10:00:01"
        columns={1}
      />,
    );

    expect(lastFrame()).toContain('Server Deck');
    expect(lastFrame()).toContain('ACTIVE TILE');
    expect(lastFrame()).toContain('survival');
    expect(lastFrame()).toContain('RUNNING');
    expect(lastFrame()).not.toContain('Event Stream');
    expect(lastFrame()).not.toContain('Live Log Tail');
  });
});
