-- UPDATED Kulüp · kullanıcı ilerlemesi (Supabase Auth ile).
-- Payload tabloları "payload" şemasında; Kulüp tabloları "kulup" şemasında, satır güvenliği açık.
create schema if not exists kulup;

create table if not exists kulup.ilerleme (
  user_id uuid not null references auth.users(id) on delete cascade,
  adim text not null,                 -- "yol/modul/adim" (Payload KulupTracks slug'larından)
  tamamlandi_at timestamptz not null default now(),
  puan int,                           -- alıştırma/sınav sonucu
  primary key (user_id, adim)
);

create table if not exists kulup.rozetler (
  user_id uuid not null references auth.users(id) on delete cascade,
  rozet text not null,
  kazanildi_at timestamptz not null default now(),
  primary key (user_id, rozet)
);

create table if not exists kulup.teslimler (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  gorev text not null,                -- haftalık görev kimliği
  gorsel_yolu text,                   -- storage: kulup-teslimler/<user_id>/<dosya>
  not_metni text,
  durum text not null default 'bekliyor' check (durum in ('bekliyor','onaylandi','reddedildi')),
  geri_bildirim text,
  created_at timestamptz not null default now()
);

create or replace view kulup.xp as
  select user_id, coalesce(sum(coalesce(puan, 10)), 0)::int as xp from kulup.ilerleme group by user_id;

alter table kulup.ilerleme enable row level security;
alter table kulup.rozetler enable row level security;
alter table kulup.teslimler enable row level security;

create policy "kendi ilerlemem" on kulup.ilerleme for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "kendi rozetlerim" on kulup.rozetler for select using (auth.uid() = user_id);
create policy "kendi teslimlerim · oku" on kulup.teslimler for select using (auth.uid() = user_id);
create policy "kendi teslimlerim · ekle" on kulup.teslimler for insert with check (auth.uid() = user_id and durum = 'bekliyor');
-- Rozet verme ve teslim onayı yalnız sunucuda (service role) yapılır.

grant usage on schema kulup to authenticated;
grant select, insert, update, delete on kulup.ilerleme to authenticated;
grant select on kulup.rozetler, kulup.xp to authenticated;
grant select, insert on kulup.teslimler to authenticated;
