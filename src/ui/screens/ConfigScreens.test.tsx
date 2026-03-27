import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { ConfigServersScreen } from './ConfigServersScreen.js';
import { ConfigTypesScreen } from './ConfigTypesScreen.js';

describe('Config screens', () => {
  it('renders server registry rows', () => {
    const { lastFrame } = render(
      <ConfigServersScreen
        servers={{
          survival: {
            type: 'paper',
            path: '/srv/minecraft/survival',
            port: 25565,
          },
        }}
        selectedIndex={0}
        notice={{ level: 'info', text: 'Manage entries' }}
      />,
    );

    expect(lastFrame()).toContain('Config Studio / Server Registry');
    expect(lastFrame()).toContain('survival');
    expect(lastFrame()).toContain('paper');
  });

  it('renders type library rows', () => {
    const { lastFrame } = render(
      <ConfigTypesScreen
        types={{
          paper: {
            memory: '4G',
            min_memory: '2G',
            jvm_flags: ['-XX:+UseG1GC', '-XX:+AlwaysPreTouch'],
          },
        }}
        selectedIndex={0}
        notice={{ level: 'info', text: 'Manage type profiles' }}
      />,
    );

    expect(lastFrame()).toContain('Config Studio / Type Library');
    expect(lastFrame()).toContain('paper');
    expect(lastFrame()).toContain('2 flags');
  });
});
