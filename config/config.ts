/**
 * Custom Configuration
 * --------------------
 * Copy the settings you want to override from `config.example.ts` into this file.
 *
 * This file exists to avoid build-time "module not found" warnings in Next.js
 * when no custom config is present yet.
 */

import type { Config } from './config.example';

export const config = {} satisfies Partial<Config>;
