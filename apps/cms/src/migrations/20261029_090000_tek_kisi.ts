import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Tek kişi kaydı (29 Ekim 2026, karar 36). Kişi = e-posta: Uper kaydı (payload.uyeler), Stüdyo profili (public.profiles) ve
 * haber imzası (payload.authors, kullanıcının Yazar profili) aynı kişi; ad ve fotoğraf birinde değişince öbürlerine yazılır.
 * Stüdyo'da yüklenen fotoğraf Uper'de "studyo" türüdür; Uper'de Google/Gravatar seçilince Stüdyo profiline geçer.
 * Profili yazma izni Stüdyo göçü 0049'dan gelir; izin yoksa bu göç yalnız işlevleri kurar, eşitleme yapmaz (panel güncellemesi durmaz).
 * Profil tarafının tetikleyicisini (payload.kisi_profilden) Stüdyo göçü 0050 bağlar.
 * İlk eşitleme (payload.kisi_ilk_esitleme, tekrar çağrılabilir; Stüdyo 0050 de çağırır): üç yerdeki adın en uzunu (soyadlı olan) ortak ad; Stüdyo fotoğrafı varsa o, yoksa Uper'in Google/Gravatar fotoğrafı.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql.raw(`
create or replace function payload.kisi_yazar_adi(p_eposta text, p_ad text) returns void
language sql security definer set search_path = payload, public as $f$
  update payload.authors a set name = p_ad, updated_at = now()
  from payload.users u
  where u.author_id = a.id and lower(u.email) = lower(p_eposta) and a.name is distinct from p_ad and length(btrim(p_ad)) >= 2;
$f$;

create or replace function payload.kisi_profilden() returns trigger
language plpgsql security definer set search_path = payload, public as $f$
begin
  if pg_trigger_depth() > 1 then return new; end if;
  if new.name is distinct from old.name and length(btrim(coalesce(new.name, ''))) >= 2 then
    update payload.uyeler set ad = left(btrim(new.name), 40), updated_at = now() where lower(email) = lower(new.email) and ad is distinct from left(btrim(new.name), 40);
    perform payload.kisi_yazar_adi(new.email, btrim(new.name));
  end if;
  if new.avatar_url is distinct from old.avatar_url then
    if coalesce(new.avatar_url, '') <> '' then
      update payload.uyeler set foto_tur = 'studyo', foto = new.avatar_url, updated_at = now() where lower(email) = lower(new.email) and foto is distinct from new.avatar_url;
    else
      update payload.uyeler set foto_tur = 'harf', foto = null, updated_at = now() where lower(email) = lower(new.email) and foto_tur = 'studyo';
    end if;
  end if;
  return new;
end $f$;

create or replace function payload.kisi_uperden() returns trigger
language plpgsql security definer set search_path = payload, public as $f$
declare v_id uuid; v_foto text;
begin
  if pg_trigger_depth() > 1 then return new; end if;
  begin
    select id, nullif(avatar_url, '') into v_id, v_foto from public.profiles where lower(email) = lower(new.email) limit 1;
  exception when insufficient_privilege then return new; end;
  if v_id is null then return new; end if;
  if tg_op = 'INSERT' and v_foto is not null and new.foto is null then
    update payload.uyeler set foto_tur = 'studyo', foto = v_foto where id = new.id;
  end if;
  begin
    if tg_op = 'INSERT' or new.ad is distinct from old.ad then
      update public.profiles set name = new.ad where id = v_id and name is distinct from new.ad;
      perform payload.kisi_yazar_adi(new.email, new.ad);
    end if;
    if tg_op = 'UPDATE' and (new.foto is distinct from old.foto or new.foto_tur is distinct from old.foto_tur) and new.foto_tur::text <> 'studyo' then
      update public.profiles set avatar_url = case when new.foto_tur::text in ('google', 'gravatar') then new.foto else null end
      where id = v_id and avatar_url is distinct from (case when new.foto_tur::text in ('google', 'gravatar') then new.foto else null end);
    end if;
  exception when insufficient_privilege then null; -- Stüdyo göçü 0049 uygulanmadıysa profil yazılmaz, Uper işi durmaz
  end;
  return new;
end $f$;

drop trigger if exists kisi_uperden on payload.uyeler;
create trigger kisi_uperden after insert or update of ad, foto, foto_tur on payload.uyeler for each row execute function payload.kisi_uperden();

grant usage on schema payload to postgres;
grant execute on function payload.kisi_profilden() to postgres;

create or replace function payload.kisi_ilk_esitleme() returns void
language plpgsql security definer set search_path = payload, public as $d$
declare r record; v_ad text;
begin
  if not has_column_privilege('public.profiles', 'name', 'UPDATE') then
    raise notice 'Stüdyo göçü 0049 yok: ilk eşitleme atlandı (0050 yeniden çağırır)';
    return;
  end if;
  for r in
    select p.id as pid, p.email, p.name as pad, nullif(p.avatar_url, '') as pfoto, y.id as yid, y.ad as yad, nullif(y.foto, '') as yfoto, y.foto_tur::text as ytur,
           (select a.name from payload.users u join payload.authors a on a.id = u.author_id where lower(u.email) = lower(p.email) limit 1) as aad
    from public.profiles p left join payload.uyeler y on lower(y.email) = lower(p.email)
  loop
    select x into v_ad from unnest(array[r.yad, r.aad, r.pad]) x where length(btrim(coalesce(x, ''))) >= 2 order by length(btrim(x)) desc limit 1;
    if v_ad is null then continue; end if;
    v_ad := left(btrim(v_ad), 40);
    update public.profiles set name = v_ad where id = r.pid and name is distinct from v_ad;
    perform payload.kisi_yazar_adi(r.email, v_ad);
    if r.yid is not null then
      update payload.uyeler set ad = v_ad where id = r.yid and ad is distinct from v_ad;
      if r.pfoto is not null then
        update payload.uyeler set foto_tur = 'studyo', foto = r.pfoto where id = r.yid and foto is distinct from r.pfoto;
      elsif r.yfoto is not null and r.ytur in ('google', 'gravatar') then
        update public.profiles set avatar_url = r.yfoto where id = r.pid;
      end if;
    end if;
  end loop;
end $d$;
grant execute on function payload.kisi_ilk_esitleme() to postgres;
select payload.kisi_ilk_esitleme();`))
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.raw(`drop trigger if exists kisi_uperden on payload.uyeler;`))
}
