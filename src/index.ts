#!/usr/bin/env node

import { createProgram } from './cli.js';

const program = createProgram();

program.parseAsync(process.argv).catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
