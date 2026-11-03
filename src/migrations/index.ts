import * as migration_20261023_084704_initial from './20261023_084704_initial';

export const migrations = [
  {
    up: migration_20261023_084704_initial.up,
    down: migration_20261023_084704_initial.down,
    name: '20261023_084704_initial'
  },
];
