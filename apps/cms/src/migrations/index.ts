import * as migration_20261022_171249_ilk_kurulum from './20261022_171249_ilk_kurulum';
import * as migration_20261024_145308_uye_topluluk from './20261024_145308_uye_topluluk';
import * as migration_20261024_161937_uye_giris_ayar from './20261024_161937_uye_giris_ayar';
import * as migration_20261024_205512_uye_unvan from './20261024_205512_uye_unvan';
import * as migration_20261025_155645_urun_turleri from './20261025_155645_urun_turleri';
import * as migration_20261025_172240_uye_profil_resmi from './20261025_172240_uye_profil_resmi';
import * as migration_20261026_110246_yarismalar from './20261026_110246_yarismalar';

export const migrations = [
  {
    up: migration_20261022_171249_ilk_kurulum.up,
    down: migration_20261022_171249_ilk_kurulum.down,
    name: '20261022_171249_ilk_kurulum',
  },
  {
    up: migration_20261024_145308_uye_topluluk.up,
    down: migration_20261024_145308_uye_topluluk.down,
    name: '20261024_145308_uye_topluluk',
  },
  {
    up: migration_20261024_161937_uye_giris_ayar.up,
    down: migration_20261024_161937_uye_giris_ayar.down,
    name: '20261024_161937_uye_giris_ayar',
  },
  {
    up: migration_20261024_205512_uye_unvan.up,
    down: migration_20261024_205512_uye_unvan.down,
    name: '20261024_205512_uye_unvan',
  },
  {
    up: migration_20261025_155645_urun_turleri.up,
    down: migration_20261025_155645_urun_turleri.down,
    name: '20261025_155645_urun_turleri',
  },
  {
    up: migration_20261025_172240_uye_profil_resmi.up,
    down: migration_20261025_172240_uye_profil_resmi.down,
    name: '20261025_172240_uye_profil_resmi',
  },
  {
    up: migration_20261026_110246_yarismalar.up,
    down: migration_20261026_110246_yarismalar.down,
    name: '20261026_110246_yarismalar'
  },
];
