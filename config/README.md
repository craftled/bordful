# Configuration System

This directory contains the configuration system for the job board.

## Quick Start

1. Copy `config.example.ts` to `config.ts`
2. Customize `config.ts` with your settings
3. The app will use your custom configuration

## How It Works

- The source repository only includes `config.example.ts` as a template
- When you fork the repository, you can create your own `config.ts` based on the example
- Your custom configuration will override the example configuration
- This approach allows you to pull updates from the source repository without conflicts

## Customizing Your Configuration

To customize your configuration:

```bash
# Copy the example configuration
cp config/config.example.ts config/config.ts

# Edit the configuration with your settings
# (Open config/config.ts in your editor)
```

Then modify the values in `config.ts` to match your requirements.

## Content Security Policy

`next.config.ts` reads this configuration to add the origins of scripts in `config.scripts` to the Content Security Policy. Keep `config.ts` free of value imports that use the `@/` path alias (type-only imports and relative imports are fine). If `config.ts` fails to load while `next.config.ts` is compiled, the example configuration is used for the CSP and your script origins will be missing.

## Configuration Options

See `config.example.ts` for a complete list of configuration options and their descriptions. 