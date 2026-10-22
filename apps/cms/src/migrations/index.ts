import * as migration_20261022_171249_ilk_kurulum from './20261022_171249_ilk_kurulum';

export const migrations = [
  {
    up: migration_20261022_171249_ilk_kurulum.up,
    down: migration_20261022_171249_ilk_kurulum.down,
    name: '20261022_171249_ilk_kurulum'
  },
];
