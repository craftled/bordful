import * as migration_20261023_084704_initial from './20261023_084704_initial';
import * as migration_20261103_014022_sync_budget from './20261103_014022_sync_budget';
import * as migration_20261103_172311_settings_paper_defaults from './20261103_172311_settings_paper_defaults';
import * as migration_20261104_091214_job_search_fields from './20261104_091214_job_search_fields';
import * as migration_20261104_170559_import_blocklist from './20261104_170559_import_blocklist';
import * as migration_20261106_090008_remove_bounced_status from './20261106_090008_remove_bounced_status';

export const migrations = [
  {
    up: migration_20261023_084704_initial.up,
    down: migration_20261023_084704_initial.down,
    name: '20261023_084704_initial',
  },
  {
    up: migration_20261103_014022_sync_budget.up,
    down: migration_20261103_014022_sync_budget.down,
    name: '20261103_014022_sync_budget',
  },
  {
    up: migration_20261103_172311_settings_paper_defaults.up,
    down: migration_20261103_172311_settings_paper_defaults.down,
    name: '20261103_172311_settings_paper_defaults',
  },
  {
    up: migration_20261104_091214_job_search_fields.up,
    down: migration_20261104_091214_job_search_fields.down,
    name: '20261104_091214_job_search_fields',
  },
  {
    up: migration_20261104_170559_import_blocklist.up,
    down: migration_20261104_170559_import_blocklist.down,
    name: '20261104_170559_import_blocklist',
  },
  {
    up: migration_20261106_090008_remove_bounced_status.up,
    down: migration_20261106_090008_remove_bounced_status.down,
    name: '20261106_090008_remove_bounced_status'
  },
];
