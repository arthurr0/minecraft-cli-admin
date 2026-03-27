import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { MessageBar } from './MessageBar.js';

describe('MessageBar', () => {
  it('renders the default ready state when there is no message', () => {
    const { lastFrame } = render(<MessageBar />);

    expect(lastFrame()).toContain('Event Stream idle');
  });

  it('renders an error label when the level is error', () => {
    const { lastFrame } = render(<MessageBar message="Port is already in use" level="error" />);

    expect(lastFrame()).toContain('ALERT');
    expect(lastFrame()).toContain('Port is already in use');
  });
});
