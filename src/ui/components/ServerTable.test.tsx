import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { ServerTable } from './ServerTable.js';
import type { ServerInfo } from '../../types/server.js';

const servers: ServerInfo[] = [
  {
    name: 'survival',
    status: 'running',
    pid: 1234,
    uptime: '1h 20m',
    memoryMB: 2048,
    portInUse: true,
    config: {
      type: 'paper',
      path: '/opt/minecraft/survival',
      port: 25565,
    },
    typeConfig: {
      memory: '4G',
      min_memory: '2G',
      jvm_flags: ['-XX:+UseG1GC'],
    },
  },
];

describe('ServerTable', () => {
  it('renders fleet overview rows with server metadata', () => {
    const { lastFrame } = render(
      <ServerTable
        servers={servers}
        selectedIndex={0}
        isLoading={false}
      />
    );

    expect(lastFrame()).toContain('Fleet Matrix');
    expect(lastFrame()).toContain('survival');
    expect(lastFrame()).toContain('RUNNING');
    expect(lastFrame()).toContain('25565');
    expect(lastFrame()).toContain('paper');
  });

  it('renders an error state when loading fails', () => {
    const { lastFrame } = render(
      <ServerTable
        servers={[]}
        selectedIndex={-1}
        isLoading={false}
        error="screen binary not available"
      />
    );

    expect(lastFrame()).toContain('Telemetry load failed');
    expect(lastFrame()).toContain('screen binary not available');
  });
});
