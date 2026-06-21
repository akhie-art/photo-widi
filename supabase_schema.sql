-- ============================================================
-- GLOW Virtual Photobooth — Supabase Schema
-- Jalankan script ini di Supabase Dashboard → SQL Editor
-- Aman dijalankan ulang (idempotent / CREATE IF NOT EXISTS)
-- ============================================================


-- Drop tables that are no longer used
drop table if exists layout_assets cascade;
drop table if exists frame_assets cascade;


-- ── Helper: auto-update updated_at ──────────────────────────────────────────
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ── 1. Tabel konfigurasi event (1 baris saja, id = '00000000-0000-0000-0000-000000000000') ────────────────
create table if not exists booth_config (
  id          uuid primary key default gen_random_uuid(),
  config_json jsonb not null,
  updated_at  timestamptz default now()
);

drop trigger if exists trg_booth_config_updated_at on booth_config;
create trigger trg_booth_config_updated_at
  before update on booth_config
  for each row execute function update_updated_at_column();

-- ── 3. Tabel filter kamera ───────────────────────────────────────────────────
create table if not exists filter_assets (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  css         text not null,
  created_at  timestamptz default now()
);


-- ── 4. Tabel stiker & emoji ──────────────────────────────────────────────────
create table if not exists sticker_assets (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null,
  created_at  timestamptz default now()
);

-- Pastikan kolom name di sticker_assets dihapus jika tabel sudah dibuat sebelumnya
alter table sticker_assets drop column if exists name;


-- ── 5. Tabel template instan (presets) ──────────────────────────────────────
--   Catatan:
--   • force_layout: jika true, pilihan layout manual dikunci.
create table if not exists preset_templates (
  id               uuid primary key default gen_random_uuid(),
  name             text,
  image_overlay    text,
  custom_slots     jsonb,
  overlay_x        numeric default 0,
  overlay_y        numeric default 0,
  overlay_w        numeric default 100,
  overlay_h        numeric default 100,
  overlay_rotation numeric default 0,
  force_layout     boolean default true,
  paper_size       text default '2R',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

drop trigger if exists trg_preset_templates_updated_at on preset_templates;
create trigger trg_preset_templates_updated_at
  before update on preset_templates
  for each row execute function update_updated_at_column();

-- Pastikan kolom layout overlay dan konfigurasi tambahan ditambahkan jika tabel preset_templates sudah ada sebelumnya
alter table preset_templates add column if not exists name text;
alter table preset_templates add column if not exists overlay_x numeric default 0;
alter table preset_templates add column if not exists overlay_y numeric default 0;
alter table preset_templates add column if not exists overlay_w numeric default 100;
alter table preset_templates add column if not exists overlay_h numeric default 100;
alter table preset_templates add column if not exists overlay_rotation numeric default 0;
alter table preset_templates add column if not exists force_layout boolean default true;
alter table preset_templates add column if not exists paper_size text default '2R';

-- ── 7. Tabel foto strip tamu ─────────────────────────────────────────────────
--   Catatan: operator_name ditambahkan — digunakan oleh addPhoto() di store.
create table if not exists photo_strips (
  id             uuid primary key default gen_random_uuid(),
  data_url       text not null,
  customer_name  text,
  customer_phone text,
  sessions_count integer default 1,
  operator_name  text,                        -- nama operator yang mencatat sesi
  timestamp      text,
  captured_photos text[],                     -- array of base64 individual photos
  created_at     timestamptz default now()
);

-- Pastikan kolom captured_photos ditambahkan jika tabel photo_strips sudah ada sebelumnya
alter table photo_strips add column if not exists captured_photos text[];
alter table photo_strips add column if not exists payment_method text;
alter table photo_strips add column if not exists amount integer;

-- Index untuk performa query foto (descending)
create index if not exists photo_strips_created_at_idx on photo_strips (created_at desc);


-- ── 8. Akun Operator dan Admin (Supabase Auth) ─────────────────────────────────
-- Akun pengguna sekarang dikelola secara asli oleh Supabase Auth (di dalam skema auth.users).
-- Anda dapat menambahkan pengguna baru langsung dari Supabase Dashboard → Authentication → Users.
-- Pastikan Anda menyetel 'role' dan 'display_name' di dalam kolom User Metadata ketika membuat akun:
-- Contoh Metadata: {"role": "admin", "display_name": "Super Admin"} atau {"role": "operator", "display_name": "Ani Wijaya"}

-- ════════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- Booth ini berjalan sebagai single-machine / anon client, sehingga semua
-- operasi diizinkan melalui anon key. Sesuaikan jika menambahkan autentikasi.
-- ════════════════════════════════════════════════════════════════════════════

alter table booth_config     enable row level security;
alter table filter_assets    enable row level security;
alter table sticker_assets   enable row level security;
alter table preset_templates enable row level security;
alter table photo_strips     enable row level security;

-- ── booth_config ─────────────────────────────────────────────────────────────
drop policy if exists "public read booth_config"   on booth_config;
drop policy if exists "public upsert booth_config" on booth_config;
drop policy if exists "public update booth_config" on booth_config;

create policy "public read booth_config"   on booth_config for select using (true);
create policy "public upsert booth_config" on booth_config for insert with check (true);
create policy "public update booth_config" on booth_config for update using (true);


-- ── filter_assets ────────────────────────────────────────────────────────────
drop policy if exists "public read filter_assets"   on filter_assets;
drop policy if exists "public insert filter_assets" on filter_assets;
drop policy if exists "public update filter_assets" on filter_assets;
drop policy if exists "public delete filter_assets" on filter_assets;

create policy "public read filter_assets"   on filter_assets for select using (true);
create policy "public insert filter_assets" on filter_assets for insert with check (true);
create policy "public update filter_assets" on filter_assets for update using (true);
create policy "public delete filter_assets" on filter_assets for delete using (true);

-- ── sticker_assets ───────────────────────────────────────────────────────────
drop policy if exists "public read sticker_assets"   on sticker_assets;
drop policy if exists "public insert sticker_assets" on sticker_assets;
drop policy if exists "public update sticker_assets" on sticker_assets;
drop policy if exists "public delete sticker_assets" on sticker_assets;

create policy "public read sticker_assets"   on sticker_assets for select using (true);
create policy "public insert sticker_assets" on sticker_assets for insert with check (true);
create policy "public update sticker_assets" on sticker_assets for update using (true);
create policy "public delete sticker_assets" on sticker_assets for delete using (true);

-- ── preset_templates ─────────────────────────────────────────────────────────
drop policy if exists "public read preset_templates"   on preset_templates;
drop policy if exists "public insert preset_templates" on preset_templates;
drop policy if exists "public update preset_templates" on preset_templates;
drop policy if exists "public delete preset_templates" on preset_templates;

create policy "public read preset_templates"   on preset_templates for select using (true);
create policy "public insert preset_templates" on preset_templates for insert with check (true);
create policy "public update preset_templates" on preset_templates for update using (true);
create policy "public delete preset_templates" on preset_templates for delete using (true);


-- ── photo_strips ──────────────────────────────────────────────────────────────
drop policy if exists "public read photo_strips"   on photo_strips;
drop policy if exists "public insert photo_strips" on photo_strips;
drop policy if exists "public update photo_strips" on photo_strips;
drop policy if exists "public delete photo_strips" on photo_strips;

create policy "public read photo_strips"   on photo_strips for select using (true);
create policy "public insert photo_strips" on photo_strips for insert with check (true);
create policy "public update photo_strips" on photo_strips for update using (true);
create policy "public delete photo_strips" on photo_strips for delete using (true);

-- ════════════════════════════════════════════════════════════════════════════
-- Seeder Data Default
-- ════════════════════════════════════════════════════════════════════════════

-- Aktifkan ekstensi uuid-ossp untuk UUID generation
create extension if not exists "uuid-ossp";

-- ── Akun operator dan admin bawaan (Supabase Auth) ───────────────────────────
-- Admin: admin@glowbooth.com / admin123
-- Operator: ani@glowbooth.com / 1111

-- Hapus data lama agar bersih dan tidak bentrok
delete from auth.identities where user_id in ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12');
delete from auth.users where id in ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12');

-- 1. Buat Admin (admin@glowbooth.com / admin123)
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) values (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '00000000-0000-0000-0000-000000000000',
  'admin@glowbooth.com',
  crypt('admin123', gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"admin","display_name":"Super Admin"}',
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
);

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11","email":"admin@glowbooth.com"}',
  'email',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  now(),
  now(),
  now()
);

-- 2. Buat Operator (ani@glowbooth.com / 1111)
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) values (
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  '00000000-0000-0000-0000-000000000000',
  'ani@glowbooth.com',
  crypt('1111', gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"operator","display_name":"Ani Wijaya"}',
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
);

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  '{"sub":"b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12","email":"ani@glowbooth.com"}',
  'email',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  now(),
  now(),
  now()
);

-- Blok PL/pgSQL untuk melengkapi kolom token tambahan secara dinamis jika ada
DO $$
BEGIN
  -- Periksa dan update kolom token lainnya agar tidak NULL
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'email_change_token_current') THEN
    UPDATE auth.users SET email_change_token_current = '' WHERE email_change_token_current IS NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'phone_change_token') THEN
    UPDATE auth.users SET phone_change_token = '' WHERE phone_change_token IS NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'reauthentication_token') THEN
    UPDATE auth.users SET reauthentication_token = '' WHERE reauthentication_token IS NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'phone_change') THEN
    UPDATE auth.users SET phone_change = '' WHERE phone_change IS NULL;
  END IF;
END $$;




-- ── Filter kamera bawaan ──────────────────────────────────────────────────────
insert into filter_assets (id, name, css)
values
  ('00000000-0000-0000-0000-000000000001', 'Original',     'none'),
  ('00000000-0000-0000-0000-000000000002', 'Retro B&W',    'grayscale(1) contrast(1.3) brightness(1.05)'),
  ('00000000-0000-0000-0000-000000000003', 'Warm Film',    'sepia(0.4) contrast(1.1) saturate(1.1) brightness(0.95)'),
  ('00000000-0000-0000-0000-000000000004', 'Neon Glow',    'hue-rotate(240deg) saturate(1.8) brightness(1.1)'),
  ('00000000-0000-0000-0000-000000000005', 'Sepia Dream',  'sepia(0.8) hue-rotate(-20deg) saturate(1.3)'),
  ('00000000-0000-0000-0000-000000000006', 'Cyberpunk',    'hue-rotate(295deg) saturate(1.7) contrast(1.15)'),
  ('00000000-0000-0000-0000-000000000007', 'Pop Art',      'saturate(2.3) contrast(1.25)'),
  ('00000000-0000-0000-0000-000000000008', 'Classic Noir', 'grayscale(1) contrast(1.9) brightness(0.9)')
on conflict (id) do update set
  name = excluded.name,
  css  = excluded.css;


-- ── 9. Setup Supabase Storage Bucket 'photostrips' ───────────────────────────
-- Membuat bucket untuk menyimpan file photostrip jika belum ada
insert into storage.buckets (id, name, public)
values ('photostrips', 'photostrips', true)
on conflict (id) do nothing;

-- Kebijakan RLS untuk objek Storage
drop policy if exists "Public Access for Photostrips" on storage.objects;
create policy "Public Access for Photostrips" on storage.objects
  for select using (bucket_id = 'photostrips');

drop policy if exists "Insert Access for Photostrips" on storage.objects;
create policy "Insert Access for Photostrips" on storage.objects
  for insert with check (bucket_id = 'photostrips');

drop policy if exists "Update Access for Photostrips" on storage.objects;
create policy "Update Access for Photostrips" on storage.objects
  for update using (bucket_id = 'photostrips');

drop policy if exists "Delete Access for Photostrips" on storage.objects;
create policy "Delete Access for Photostrips" on storage.objects
  for delete using (bucket_id = 'photostrips');


-- ── 9b. Setup Supabase Storage Bucket 'preset-overlays' ──────────────────────
-- Bucket khusus untuk menyimpan gambar overlay template preset
-- Kolom image_overlay di preset_templates hanya menyimpan URL publik dari bucket ini
insert into storage.buckets (id, name, public)
values ('preset-overlays', 'preset-overlays', true)
on conflict (id) do nothing;

-- Kebijakan RLS untuk bucket preset-overlays
drop policy if exists "Public Access for Preset Overlays" on storage.objects;
create policy "Public Access for Preset Overlays" on storage.objects
  for select using (bucket_id = 'preset-overlays');

drop policy if exists "Insert Access for Preset Overlays" on storage.objects;
create policy "Insert Access for Preset Overlays" on storage.objects
  for insert with check (bucket_id = 'preset-overlays');

drop policy if exists "Update Access for Preset Overlays" on storage.objects;
create policy "Update Access for Preset Overlays" on storage.objects
  for update using (bucket_id = 'preset-overlays');

drop policy if exists "Delete Access for Preset Overlays" on storage.objects;
create policy "Delete Access for Preset Overlays" on storage.objects
  for delete using (bucket_id = 'preset-overlays');


-- ── 9c. Setup Supabase Storage Bucket 'sticker-assets' ───────────────────────
-- Bucket khusus untuk menyimpan gambar stiker PNG transparan
-- Kolom image_url di sticker_assets hanya menyimpan URL publik dari bucket ini
-- Stiker teks emoji tidak menggunakan bucket ini (disimpan langsung sebagai teks)
insert into storage.buckets (id, name, public)
values ('sticker-assets', 'sticker-assets', true)
on conflict (id) do nothing;

-- Kebijakan RLS untuk bucket sticker-assets
drop policy if exists "Public Access for Sticker Assets" on storage.objects;
create policy "Public Access for Sticker Assets" on storage.objects
  for select using (bucket_id = 'sticker-assets');

drop policy if exists "Insert Access for Sticker Assets" on storage.objects;
create policy "Insert Access for Sticker Assets" on storage.objects
  for insert with check (bucket_id = 'sticker-assets');

drop policy if exists "Update Access for Sticker Assets" on storage.objects;
create policy "Update Access for Sticker Assets" on storage.objects
  for update using (bucket_id = 'sticker-assets');

drop policy if exists "Delete Access for Sticker Assets" on storage.objects;
create policy "Delete Access for Sticker Assets" on storage.objects
  for delete using (bucket_id = 'sticker-assets');


-- ── 9d. Setup Supabase Storage Bucket 'event-assets' ─────────────────────────
-- Bucket khusus untuk menyimpan logo & QRIS per-event di tabel 'events'
-- Setiap event di halaman Manajemen Event menyimpan asetnya di sini
insert into storage.buckets (id, name, public)
values ('event-assets', 'event-assets', true)
on conflict (id) do nothing;

-- Kebijakan RLS untuk bucket event-assets
drop policy if exists "Public Access for Event Assets" on storage.objects;
create policy "Public Access for Event Assets" on storage.objects
  for select using (bucket_id = 'event-assets');

drop policy if exists "Insert Access for Event Assets" on storage.objects;
create policy "Insert Access for Event Assets" on storage.objects
  for insert with check (bucket_id = 'event-assets');

drop policy if exists "Update Access for Event Assets" on storage.objects;
create policy "Update Access for Event Assets" on storage.objects
  for update using (bucket_id = 'event-assets');

drop policy if exists "Delete Access for Event Assets" on storage.objects;
create policy "Delete Access for Event Assets" on storage.objects
  for delete using (bucket_id = 'event-assets');


-- ── 9e. Setup Supabase Storage Bucket 'booth-config' ─────────────────────────
-- Bucket khusus untuk menyimpan aset konfigurasi utama booth (tabel booth_config):
-- • Logo utama photobooth (logoUrl di config_json)
-- • Barcode QRIS utama (qrisUrl di config_json)
-- Dipisahkan dari event-assets agar konfigurasi default booth tidak bercampur
-- dengan aset per-event dari halaman Manajemen Event.
insert into storage.buckets (id, name, public)
values ('booth-config', 'booth-config', true)
on conflict (id) do nothing;

-- Kebijakan RLS untuk bucket booth-config
drop policy if exists "Public Access for Booth Config" on storage.objects;
create policy "Public Access for Booth Config" on storage.objects
  for select using (bucket_id = 'booth-config');

drop policy if exists "Insert Access for Booth Config" on storage.objects;
create policy "Insert Access for Booth Config" on storage.objects
  for insert with check (bucket_id = 'booth-config');

drop policy if exists "Update Access for Booth Config" on storage.objects;
create policy "Update Access for Booth Config" on storage.objects
  for update using (bucket_id = 'booth-config');

drop policy if exists "Delete Access for Booth Config" on storage.objects;
create policy "Delete Access for Booth Config" on storage.objects
  for delete using (bucket_id = 'booth-config');


-- ── 10. Fungsi RPC untuk Manajemen Operator dari Admin Panel ──────────────────
-- Jalankan fungsi ini untuk mengizinkan Admin CRUD akun Operator

create or replace function get_operators()
returns table (
  id uuid,
  email varchar,
  display_name text,
  created_at timestamptz
) 
security definer
as $$
begin
  return query
  select 
    u.id, 
    u.email::varchar, 
    (u.raw_user_meta_data->>'display_name')::text as display_name,
    u.created_at
  from auth.users u
  where u.raw_user_meta_data->>'role' = 'operator'
  order by u.created_at desc;
end;
$$ language plpgsql;

create or replace function create_operator(
  p_email text,
  p_password text,
  p_display_name text
)
returns uuid
security definer
as $$
declare
  new_id uuid;
begin
  new_id := gen_random_uuid();
  
  if exists (select 1 from auth.users where email = p_email) then
    raise exception 'Email % sudah terdaftar', p_email;
  end if;

  insert into auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) values (
    new_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_password, gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    json_build_object('role', 'operator', 'display_name', p_display_name)::jsonb,
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    new_id,
    new_id,
    json_build_object('sub', new_id::text, 'email', p_email)::jsonb,
    'email',
    new_id::text,
    now(),
    now(),
    now()
  );

  return new_id;
end;
$$ language plpgsql;

create or replace function update_operator(
  p_user_id uuid,
  p_email text,
  p_password text,
  p_display_name text
)
returns boolean
security definer
as $$
begin
  if exists (select 1 from auth.users where email = p_email and id <> p_user_id) then
    raise exception 'Email % sudah terdaftar oleh operator lain', p_email;
  end if;

  if p_password is not null and p_password <> '' then
    update auth.users
    set 
      email = p_email,
      encrypted_password = crypt(p_password, gen_salt('bf', 10)),
      raw_user_meta_data = json_build_object('role', 'operator', 'display_name', p_display_name)::jsonb,
      updated_at = now()
    where id = p_user_id;
  else
    update auth.users
    set 
      email = p_email,
      raw_user_meta_data = json_build_object('role', 'operator', 'display_name', p_display_name)::jsonb,
      updated_at = now()
    where id = p_user_id;
  end if;

  update auth.identities
  set 
    identity_data = json_build_object('sub', p_user_id::text, 'email', p_email)::jsonb,
    updated_at = now()
  where user_id = p_user_id;

  return true;
end;
$$ language plpgsql;

create or replace function delete_operator(
  p_user_id uuid
)
returns boolean
security definer
as $$
begin
  delete from auth.identities where user_id = p_user_id;
  delete from auth.users where id = p_user_id;
  return true;
end;
$$ language plpgsql;


-- ── Realtime: aktifkan perubahan langsung (INSERT/UPDATE/DELETE) ─────────────
-- Jalankan ini agar Supabase Realtime bisa mengirim event ke client.
-- Aman dijalankan ulang.
do $$
begin
  -- Tambahkan tabel ke publikasi realtime jika belum ada
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'booth_config'
  ) then
    alter publication supabase_realtime add table booth_config;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'filter_assets'
  ) then
    alter publication supabase_realtime add table filter_assets;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'sticker_assets'
  ) then
    alter publication supabase_realtime add table sticker_assets;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'preset_templates'
  ) then
    alter publication supabase_realtime add table preset_templates;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'photo_strips'
  ) then
    alter publication supabase_realtime add table photo_strips;
  end if;
end $$;


-- ── 11. Fungsi RPC get_bucket_size untuk Storage Usage ────────────────────────
-- Fungsi ini menjumlahkan ukuran file di dalam bucket tertentu menggunakan data metadata.
-- Menggunakan 'security definer' agar dapat diakses oleh anon/authenticated role.

create or replace function get_bucket_size(p_bucket_id text)
returns bigint
security definer
as $$
declare
  v_size bigint;
begin
  select sum((metadata->>'size')::bigint)
  into v_size
  from storage.objects
  where bucket_id = p_bucket_id;
  
  return coalesce(v_size, 0);
end;
$$ language plpgsql;


-- ── 12. Tabel Manajemen Event ───────────────────────────────────────────
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  date        text,
  location    text,
  price_per_session integer default 25000,
  logo_url    text,
  qris_url    text,
  is_active   boolean default false,
  allowed_presets text[] default '{}',
  allowed_filters text[] default '{}',
  allowed_stickers text[] default '{}',
  bg_theme    text default 'sunset',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Pastikan kolom baru ditambahkan jika tabel events sudah ada sebelumnya
alter table events add column if not exists slug text unique;
alter table events add column if not exists allowed_presets text[] default '{}';
alter table events add column if not exists allowed_filters text[] default '{}';
alter table events add column if not exists allowed_stickers text[] default '{}';
alter table events add column if not exists bg_theme text default 'sunset';
alter table events add column if not exists show_payment boolean default true;
alter table events add column if not exists show_setup boolean default true;

alter table events enable row level security;
drop policy if exists "public read events" on events;
drop policy if exists "public insert events" on events;
drop policy if exists "public update events" on events;
drop policy if exists "public delete events" on events;
create policy "public read events" on events for select using (true);
create policy "public insert events" on events for insert with check (true);
create policy "public update events" on events for update using (true);
create policy "public delete events" on events for delete using (true);

-- Tambahkan kolom event_name ke photo_strips
alter table photo_strips add column if not exists event_name text;

-- Tambahkan table events ke publikasi realtime jika belum ada
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'events'
  ) then
    alter publication supabase_realtime add table events;
  end if;
end $$;


-- ── 13. Tabel UI/UX Templates ───────────────────────────────────────────
create table if not exists ui_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bg_theme text default 'sunset',
  font_style text default 'inter',
  welcome_text text,
  footer_text text,
  show_payment boolean default true,
  show_setup boolean default true,
  mirror_default boolean default true,
  countdown_duration integer default 3,
  allowed_layouts text[] default '{"strip"}',
  logo_url text,
  qris_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table ui_templates enable row level security;
drop policy if exists "public read ui_templates" on ui_templates;
drop policy if exists "public insert ui_templates" on ui_templates;
drop policy if exists "public update ui_templates" on ui_templates;
drop policy if exists "public delete ui_templates" on ui_templates;
create policy "public read ui_templates" on ui_templates for select using (true);
create policy "public insert ui_templates" on ui_templates for insert with check (true);
create policy "public update ui_templates" on ui_templates for update using (true);
create policy "public delete ui_templates" on ui_templates for delete using (true);

-- Tambahkan kolom ui_template_id ke tabel events
alter table events add column if not exists ui_template_id uuid references ui_templates(id) on delete set null;

-- Tambahkan table ui_templates ke publikasi realtime jika belum ada
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'ui_templates'
  ) then
    alter publication supabase_realtime add table ui_templates;
  end if;
end $$;


-- ── 13b. Tabel UI/UX Components ───────────────────────────────────────────
create table if not exists ui_components (
  id uuid primary key default gen_random_uuid(),
  ui_template_id uuid references ui_templates(id) on delete cascade,
  component_id text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(ui_template_id, component_id)
);

alter table ui_components enable row level security;
drop policy if exists "public read ui_components" on ui_components;
drop policy if exists "public insert ui_components" on ui_components;
drop policy if exists "public update ui_components" on ui_components;
drop policy if exists "public delete ui_components" on ui_components;
create policy "public read ui_components" on ui_components for select using (true);
create policy "public insert ui_components" on ui_components for insert with check (true);
create policy "public update ui_components" on ui_components for update using (true);
create policy "public delete ui_components" on ui_components for delete using (true);

-- Tambahkan table ui_components ke publikasi realtime jika belum ada
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'ui_components'
  ) then
    alter publication supabase_realtime add table ui_components;
  end if;
end $$;



-- ── 14. Seed Default Preset Templates (Sekolah, Wisuda, Wedding) ──────────────
insert into preset_templates (id, name, custom_slots, force_layout, paper_size)
values 
  ('8b1d3d63-b8e7-4f67-8e68-e4b78fa7b2a1', 'Sekolah', '[{"id": "slot_sekolah_1", "xPct": 5, "yPct": 2, "widthPct": 90, "heightPct": 20.8, "rotation": 0}, {"id": "slot_sekolah_2", "xPct": 5, "yPct": 24.3, "widthPct": 90, "heightPct": 20.8, "rotation": 0}, {"id": "slot_sekolah_3", "xPct": 5, "yPct": 46.6, "widthPct": 90, "heightPct": 20.8, "rotation": 0}, {"id": "slot_sekolah_4", "xPct": 5, "yPct": 68.9, "widthPct": 90, "heightPct": 20.8, "rotation": 0}]'::jsonb, true, '2R'),
  ('9c2e4e74-c9f8-5a78-9f79-f5c89fb8c3b2', 'Wisuda', '[{"id": "slot_wisuda_1", "xPct": 5, "yPct": 5, "widthPct": 43, "heightPct": 38, "rotation": 0}, {"id": "slot_wisuda_2", "xPct": 52, "yPct": 5, "widthPct": 43, "heightPct": 38, "rotation": 0}, {"id": "slot_wisuda_3", "xPct": 5, "yPct": 47, "widthPct": 43, "heightPct": 38, "rotation": 0}, {"id": "slot_wisuda_4", "xPct": 52, "yPct": 47, "widthPct": 43, "heightPct": 38, "rotation": 0}]'::jsonb, true, '4R'),
  ('0d3f5f85-da09-6b89-0fa0-06d9afc9d4c3', 'Wedding', '[{"id": "slot_wedding_1", "xPct": 5, "yPct": 3, "widthPct": 90, "heightPct": 23.6, "rotation": 0}, {"id": "slot_wedding_2", "xPct": 5, "yPct": 28.6, "widthPct": 90, "heightPct": 23.6, "rotation": 0}, {"id": "slot_wedding_3", "xPct": 5, "yPct": 54.2, "widthPct": 90, "heightPct": 23.6, "rotation": 0}]'::jsonb, true, '2R')
on conflict (id) do update set
  name = excluded.name,
  custom_slots = excluded.custom_slots,
  force_layout = excluded.force_layout,
  paper_size = excluded.paper_size;


-- ── 15. Seed Default UI/UX Templates (Sekolah, Wisuda, Wedding) ────────────────
insert into ui_templates (id, name, bg_theme, font_style, welcome_text, footer_text, show_payment, show_setup, mirror_default, countdown_duration, allowed_layouts, logo_url, qris_url)
values
  (
    '8a3b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d', 
    'Royal Wedding (Dekorasi Full)', 
    'romantic', 
    'playfair', 
    'Silakan isi data kunjungan Anda untuk memasuki resepsi pernikahan kami dan mengabadikan momen bahagia ini.', 
    'Happy Wedding • Powered by Glowbooth', 
    true, 
    true, 
    true, 
    3, 
    '{"Wedding"}', 
    '', 
    ''
  ),
  (
    '7b2c8d9e-1f2a-3b4c-5d6e-7f8a9b0c1d2e', 
    'Sekolah Ceria (Fun & Colorful)', 
    'sunset', 
    'outfit', 
    'Halo Teman-Teman! Selamat datang di Photobooth Sekolah. Masukkan nama dan kelasmu untuk mencetak foto keseruan hari ini!', 
    'Pesta Sekolah • Powered by Glowbooth', 
    false, 
    true, 
    true, 
    3, 
    '{"Sekolah"}', 
    '', 
    ''
  ),
  (
    '9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d', 
    'Wisuda Akbar (Classic & Elegant)', 
    'luxury', 
    'cabinet', 
    'Selamat atas kelulusan Anda! Silakan masukkan nama dan gelar lengkap untuk mencetak foto kenangan kelulusan resmi.', 
    'Graduation Day • Powered by Glowbooth', 
    true, 
    true, 
    true, 
    5, 
    '{"Wisuda"}', 
    '', 
    ''
  )
on conflict (id) do update set
  name = excluded.name,
  bg_theme = excluded.bg_theme,
  font_style = excluded.font_style,
  welcome_text = excluded.welcome_text,
  footer_text = excluded.footer_text,
  show_payment = excluded.show_payment,
  show_setup = excluded.show_setup,
  mirror_default = excluded.mirror_default,
  countdown_duration = excluded.countdown_duration,
  allowed_layouts = excluded.allowed_layouts,
  logo_url = excluded.logo_url,
  qris_url = excluded.qris_url;


-- ── 15b. Seed Default UI/UX Components ───────────────────────────────────────
insert into ui_components (ui_template_id, component_id, properties)
values
  -- Wedding Components
  ('8a3b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d', 'logo', '{"hideLogo": true, "logoSize": "md"}'),
  ('8a3b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d', 'welcomeText', '{"hideWelcomeText": false, "welcomeTextSize": "lg", "welcomeTextAlignment": "center", "customWelcomeTextColor": "#e11d48", "couplePhotoUrl": "/wedding-couple.png"}'),
  ('8a3b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d', 'formRegistrasi', '{"hideFormRegistrasi": false, "visitorFormLabel": "DATA TAMU UNDANGAN", "customerNameLabel": "Nama Undangan", "customerPhoneLabel": "Nomor WhatsApp", "sessionsCountLabel": "Jumlah Cetak", "formCardPadding": "lg", "inputBgStyle": "white", "cardBorderRadius": "2xl", "cardShadow": "2xl", "cardStyle": "frameless"}'),
  ('8a3b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d', 'startBtn', '{"hideStartBtn": false, "startButtonText": "Masuk & Mulai Sesi Foto ✨", "startButtonSize": "lg", "primaryColor": "#e11d48", "buttonStyle": "gradient", "customButtonTextColor": "#ffffff"}'),
  ('8a3b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d', 'footerText', '{"hideFooterText": false}'),
  ('8a3b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d', 'qrisUpload', '{}'),
  ('8a3b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d', 'customCard', '{"showCustomCard": false, "customCardTitle": "Info Kustom", "customCardContent": "Silakan ketik petunjuk atau informasi tambahan di sini."}'),

  -- Sekolah Components
  ('7b2c8d9e-1f2a-3b4c-5d6e-7f8a9b0c1d2e', 'logo', '{"hideLogo": false, "logoSize": "md"}'),
  ('7b2c8d9e-1f2a-3b4c-5d6e-7f8a9b0c1d2e', 'welcomeText', '{"hideWelcomeText": false, "welcomeTextSize": "md", "welcomeTextAlignment": "center", "customWelcomeTextColor": "#ea580c"}'),
  ('7b2c8d9e-1f2a-3b4c-5d6e-7f8a9b0c1d2e', 'formRegistrasi', '{"hideFormRegistrasi": false, "visitorFormLabel": "DATA SISWA / GURU", "customerNameLabel": "Nama Lengkap / Panggilan", "customerPhoneLabel": "Kelas / NISN", "sessionsCountLabel": "Jumlah Cetak", "formCardPadding": "md", "inputBgStyle": "tinted", "cardBorderRadius": "lg", "cardShadow": "md", "cardStyle": "neobrutalist"}'),
  ('7b2c8d9e-1f2a-3b4c-5d6e-7f8a9b0c1d2e', 'startBtn', '{"hideStartBtn": false, "startButtonText": "Mulai Foto Seru! 🚀", "startButtonSize": "md", "primaryColor": "#ea580c", "buttonStyle": "solid", "customButtonTextColor": "#ffffff"}'),
  ('7b2c8d9e-1f2a-3b4c-5d6e-7f8a9b0c1d2e', 'footerText', '{"hideFooterText": false}'),
  ('7b2c8d9e-1f2a-3b4c-5d6e-7f8a9b0c1d2e', 'qrisUpload', '{}'),
  ('7b2c8d9e-1f2a-3b4c-5d6e-7f8a9b0c1d2e', 'customCard', '{"showCustomCard": false, "customCardTitle": "Info Kustom", "customCardContent": "Silakan ketik petunjuk atau informasi tambahan di sini."}'),

  -- Wisuda Components
  ('9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d', 'logo', '{"hideLogo": false, "logoSize": "lg"}'),
  ('9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d', 'welcomeText', '{"hideWelcomeText": false, "welcomeTextSize": "lg", "welcomeTextAlignment": "center", "customWelcomeTextColor": "#d97706"}'),
  ('9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d', 'formRegistrasi', '{"hideFormRegistrasi": false, "visitorFormLabel": "REGISTRASI WISUDAWAN", "customerNameLabel": "Nama Lengkap & Gelar", "customerPhoneLabel": "Nomor WhatsApp", "sessionsCountLabel": "Jumlah Cetak", "formCardPadding": "lg", "inputBgStyle": "white", "cardBorderRadius": "xl", "cardShadow": "xl", "cardStyle": "glass"}'),
  ('9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d', 'startBtn', '{"hideStartBtn": false, "startButtonText": "Mulai Foto Wisuda 🎓", "startButtonSize": "lg", "primaryColor": "#d97706", "buttonStyle": "gradient", "customButtonTextColor": "#ffffff"}'),
  ('9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d', 'footerText', '{"hideFooterText": false}'),
  ('9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d', 'qrisUpload', '{}'),
  ('9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d', 'customCard', '{"showCustomCard": true, "customCardTitle": "Pengambilan Foto", "customCardContent": "Setelah berfoto selesai, silakan ambil cetakan foto di meja penyerahan souvenir luar aula.", "cardStyle": "glass"}')
on conflict (ui_template_id, component_id) do update set
  properties = excluded.properties;

