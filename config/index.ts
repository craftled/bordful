/**
 * Configuration Loader
 * ------------------
 * This module exports the configuration for the job board.
 *
 * Quick Start:
 * 1. Copy config.example.ts to config.ts
 * 2. Customize config.ts with your settings
 * 3. The app will use your custom configuration
 */

import type { Config } from './config.example';
import { config as exampleConfig } from './config.example';

let customConfig: Partial<Config> | undefined;

// Try to load custom config if it exists
try {
  customConfig = require('./config').config;
} catch {
  // No custom config found, will use example config
}

// Create the final config object, merging custom config if it exists
const config: Config = {
  ...exampleConfig,
  ...(customConfig || {}),
};

export type { Config };
export default config;
