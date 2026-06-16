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


-- ── 1. Tabel konfigurasi event (1 baris saja, id = 'default') ────────────────
create table if not exists event_config (
  id          text primary key default 'default',
  config_json jsonb not null,
  updated_at  timestamptz default now()
);

drop trigger if exists trg_event_config_updated_at on event_config;
create trigger trg_event_config_updated_at
  before update on event_config
  for each row execute function update_updated_at_column();

-- ── 3. Tabel filter kamera ───────────────────────────────────────────────────
create table if not exists filter_assets (
  id          text primary key,
  name        text not null,
  css         text not null,
  created_at  timestamptz default now()
);


-- ── 4. Tabel stiker & emoji ──────────────────────────────────────────────────
create table if not exists sticker_assets (
  id          text primary key,
  name        text not null,
  image_url   text not null,
  created_at  timestamptz default now()
);


-- ── 5. Tabel template instan (presets) ──────────────────────────────────────
--   Catatan:
--   • force_layout: jika true, pilihan layout manual dikunci.
create table if not exists preset_templates (
  id               text primary key,
  name             text not null,
  image_overlay    text,
  custom_slots     jsonb,
  overlay_x        numeric default 0,
  overlay_y        numeric default 0,
  overlay_w        numeric default 100,
  overlay_h        numeric default 100,
  overlay_rotation numeric default 0,
  force_layout     boolean default true,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

drop trigger if exists trg_preset_templates_updated_at on preset_templates;
create trigger trg_preset_templates_updated_at
  before update on preset_templates
  for each row execute function update_updated_at_column();

-- ── 7. Tabel foto strip tamu ─────────────────────────────────────────────────
--   Catatan: operator_name ditambahkan — digunakan oleh addPhoto() di store.
create table if not exists photo_strips (
  id             text primary key,
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

alter table event_config     enable row level security;
alter table filter_assets    enable row level security;
alter table sticker_assets   enable row level security;
alter table preset_templates enable row level security;
alter table photo_strips     enable row level security;

-- ── event_config ─────────────────────────────────────────────────────────────
drop policy if exists "public read event_config"   on event_config;
drop policy if exists "public upsert event_config" on event_config;
drop policy if exists "public update event_config" on event_config;

create policy "public read event_config"   on event_config for select using (true);
create policy "public upsert event_config" on event_config for insert with check (true);
create policy "public update event_config" on event_config for update using (true);


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

-- ── Akun operator dan admin bawaan (Supabase Auth) ───────────────────────────
-- Admin: admin@glowbooth.com / admin123
-- Operator: ani@glowbooth.com / 1111

-- Aktifkan ekstensi uuid-ossp untuk UUID generation
create extension if not exists "uuid-ossp";

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
  ('original', 'Original',     'none'),
  ('bw',       'Retro B&W',    'grayscale(1) contrast(1.3) brightness(1.05)'),
  ('vintage',  'Warm Film',    'sepia(0.4) contrast(1.1) saturate(1.1) brightness(0.95)'),
  ('neon',     'Neon Glow',    'hue-rotate(240deg) saturate(1.8) brightness(1.1)'),
  ('sepia',    'Sepia Dream',  'sepia(0.8) hue-rotate(-20deg) saturate(1.3)'),
  ('cyber',    'Cyberpunk',    'hue-rotate(295deg) saturate(1.7) contrast(1.15)'),
  ('pop',      'Pop Art',      'saturate(2.3) contrast(1.25)'),
  ('noir',     'Classic Noir', 'grayscale(1) contrast(1.9) brightness(0.9)')
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
    new_id::text,
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
