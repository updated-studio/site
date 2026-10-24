import * as migration_20261022_171249_ilk_kurulum from './20261022_171249_ilk_kurulum';
import * as migration_20261024_145308_uye_topluluk from './20261024_145308_uye_topluluk';

export const migrations = [
  {
    up: migration_20261022_171249_ilk_kurulum.up,
    down: migration_20261022_171249_ilk_kurulum.down,
    name: '20261022_171249_ilk_kurulum',
  },
  {
    up: migration_20261024_145308_uye_topluluk.up,
    down: migration_20261024_145308_uye_topluluk.down,
    name: '20261024_145308_uye_topluluk'
  },
];
