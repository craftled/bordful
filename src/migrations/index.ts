import * as migration_20261023_084704_initial from './20261023_084704_initial';
import * as migration_20261103_004203_sync_budget from './20261103_004203_sync_budget';

export const migrations = [
  {
    up: migration_20261023_084704_initial.up,
    down: migration_20261023_084704_initial.down,
    name: '20261023_084704_initial',
  },
  {
    up: migration_20261103_004203_sync_budget.up,
    down: migration_20261103_004203_sync_budget.down,
    name: '20261103_004203_sync_budget'
  },
];
