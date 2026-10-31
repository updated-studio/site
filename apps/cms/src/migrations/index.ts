import * as migration_20261022_171249_ilk_kurulum from './20261022_171249_ilk_kurulum';
import * as migration_20261024_145308_uye_topluluk from './20261024_145308_uye_topluluk';
import * as migration_20261024_161937_uye_giris_ayar from './20261024_161937_uye_giris_ayar';
import * as migration_20261024_205512_uye_unvan from './20261024_205512_uye_unvan';
import * as migration_20261025_155645_urun_turleri from './20261025_155645_urun_turleri';
import * as migration_20261025_172240_uye_profil_resmi from './20261025_172240_uye_profil_resmi';
import * as migration_20261026_110246_yarismalar from './20261026_110246_yarismalar';
import * as migration_20261026_122038_haftalik_gorev from './20261026_122038_haftalik_gorev';
import * as migration_20261026_154634_manset_afis from './20261026_154634_manset_afis';
import * as migration_20261027_174952_kiyas_upscore from './20261027_174952_kiyas_upscore';
import * as migration_20261028_122252_yazar_avatar from './20261028_122252_yazar_avatar';
import * as migration_20261028_142805_reklam_yan from './20261028_142805_reklam_yan';
import * as migration_20261028_150000_yazar_baglari from './20261028_150000_yazar_baglari';
import * as migration_20261028_160000_kesik_basliklar from './20261028_160000_kesik_basliklar';
import * as migration_20261029_071812_uye_studyo_foto from './20261029_071812_uye_studyo_foto';
import * as migration_20261029_090000_tek_kisi from './20261029_090000_tek_kisi';
import * as migration_20261030_014451_inceleme_alt_puan from './20261030_014451_inceleme_alt_puan';
import * as migration_20261030_021746_radar_tarih from './20261030_021746_radar_tarih';
import * as migration_20261031_120636_rehber_liste from './20261031_120636_rehber_liste';
import * as migration_20261031_150000_rehber_etiketi from './20261031_150000_rehber_etiketi';
import * as migration_20261031_164459_radar_oto from './20261031_164459_radar_oto';

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
    name: '20261026_110246_yarismalar',
  },
  {
    up: migration_20261026_122038_haftalik_gorev.up,
    down: migration_20261026_122038_haftalik_gorev.down,
    name: '20261026_122038_haftalik_gorev',
  },
  {
    up: migration_20261026_154634_manset_afis.up,
    down: migration_20261026_154634_manset_afis.down,
    name: '20261026_154634_manset_afis',
  },
  {
    up: migration_20261027_174952_kiyas_upscore.up,
    down: migration_20261027_174952_kiyas_upscore.down,
    name: '20261027_174952_kiyas_upscore',
  },
  {
    up: migration_20261028_122252_yazar_avatar.up,
    down: migration_20261028_122252_yazar_avatar.down,
    name: '20261028_122252_yazar_avatar',
  },
  {
    up: migration_20261028_142805_reklam_yan.up,
    down: migration_20261028_142805_reklam_yan.down,
    name: '20261028_142805_reklam_yan',
  },
  {
    up: migration_20261028_150000_yazar_baglari.up,
    down: migration_20261028_150000_yazar_baglari.down,
    name: '20261028_150000_yazar_baglari',
  },
  {
    up: migration_20261028_160000_kesik_basliklar.up,
    down: migration_20261028_160000_kesik_basliklar.down,
    name: '20261028_160000_kesik_basliklar',
  },
  {
    up: migration_20261029_071812_uye_studyo_foto.up,
    down: migration_20261029_071812_uye_studyo_foto.down,
    name: '20261029_071812_uye_studyo_foto',
  },
  {
    up: migration_20261029_090000_tek_kisi.up,
    down: migration_20261029_090000_tek_kisi.down,
    name: '20261029_090000_tek_kisi',
  },
  {
    up: migration_20261030_014451_inceleme_alt_puan.up,
    down: migration_20261030_014451_inceleme_alt_puan.down,
    name: '20261030_014451_inceleme_alt_puan',
  },
  {
    up: migration_20261030_021746_radar_tarih.up,
    down: migration_20261030_021746_radar_tarih.down,
    name: '20261030_021746_radar_tarih',
  },
  {
    up: migration_20261031_120636_rehber_liste.up,
    down: migration_20261031_120636_rehber_liste.down,
    name: '20261031_120636_rehber_liste',
  },
  {
    up: migration_20261031_150000_rehber_etiketi.up,
    down: migration_20261031_150000_rehber_etiketi.down,
    name: '20261031_150000_rehber_etiketi',
  },
  {
    up: migration_20261031_164459_radar_oto.up,
    down: migration_20261031_164459_radar_oto.down,
    name: '20261031_164459_radar_oto'
  },
];
