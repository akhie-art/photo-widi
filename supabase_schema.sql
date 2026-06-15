-- ============================================================
-- GLOW Virtual Photobooth — Supabase Schema
-- Jalankan script ini di Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Tabel konfigurasi event (1 baris saja, id = 'default') ──
create table if not exists event_config (
  id          text primary key default 'default',
  config_json jsonb not null,
  updated_at  timestamptz default now()
);

-- ── 2. Tabel tata letak kamera (layouts) ──
create table if not exists layout_assets (
  id          text primary key,
  name        text not null,
  count       integer not null,
  description text,
  created_at  timestamptz default now()
);

-- ── 3. Tabel filter kamera ──
create table if not exists filter_assets (
  id          text primary key,
  name        text not null,
  css         text not null,
  created_at  timestamptz default now()
);

-- ── 4. Tabel stiker & emoji ──
create table if not exists sticker_assets (
  id          text primary key,
  name        text not null,
  image_url   text not null,
  created_at  timestamptz default now()
);

-- ── 5. Tabel template instan (presets) ──
create table if not exists preset_templates (
  id               text primary key,
  name             text not null,
  layout_id        text not null,
  frame_style      text not null,
  frame_text       text,
  image_overlay    text,
  custom_slots     jsonb,
  overlay_x        numeric default 0,
  overlay_y        numeric default 0,
  overlay_w        numeric default 100,
  overlay_h        numeric default 100,
  overlay_rotation numeric default 0,
  filter_id        text not null,
  allowed_stickers text[],
  force_layout     boolean default true,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ── 6. Tabel foto strip tamu ──
create table if not exists photo_strips (
  id             text primary key,
  data_url       text not null,
  customer_name  text,
  customer_phone text,
  sessions_count integer default 1,
  operator_name  text,
  timestamp      text,
  created_at     timestamptz default now()
);

-- ── Row Level Security (Public Access — single-machine booth) ──
alter table event_config     enable row level security;
alter table layout_assets    enable row level security;
alter table filter_assets    enable row level security;
alter table sticker_assets   enable row level security;
alter table preset_templates enable row level security;
alter table photo_strips     enable row level security;

-- Allow semua operasi untuk event_config
drop policy if exists "public read event_config" on event_config;
create policy "public read event_config" on event_config for select using (true);
drop policy if exists "public upsert event_config" on event_config;
create policy "public upsert event_config" on event_config for insert with check (true);
drop policy if exists "public update event_config" on event_config;
create policy "public update event_config" on event_config for update using (true);

-- Allow semua operasi untuk layout_assets
drop policy if exists "public read layout_assets" on layout_assets;
create policy "public read layout_assets" on layout_assets for select using (true);
drop policy if exists "public insert layout_assets" on layout_assets;
create policy "public insert layout_assets" on layout_assets for insert with check (true);
drop policy if exists "public update layout_assets" on layout_assets;
create policy "public update layout_assets" on layout_assets for update using (true);
drop policy if exists "public delete layout_assets" on layout_assets;
create policy "public delete layout_assets" on layout_assets for delete using (true);

-- Allow semua operasi untuk filter_assets
drop policy if exists "public read filter_assets" on filter_assets;
create policy "public read filter_assets" on filter_assets for select using (true);
drop policy if exists "public insert filter_assets" on filter_assets;
create policy "public insert filter_assets" on filter_assets for insert with check (true);
drop policy if exists "public update filter_assets" on filter_assets;
create policy "public update filter_assets" on filter_assets for update using (true);
drop policy if exists "public delete filter_assets" on filter_assets;
create policy "public delete filter_assets" on filter_assets for delete using (true);

-- Allow semua operasi untuk sticker_assets
drop policy if exists "public read sticker_assets" on sticker_assets;
create policy "public read sticker_assets" on sticker_assets for select using (true);
drop policy if exists "public insert sticker_assets" on sticker_assets;
create policy "public insert sticker_assets" on sticker_assets for insert with check (true);
drop policy if exists "public update sticker_assets" on sticker_assets;
create policy "public update sticker_assets" on sticker_assets for update using (true);
drop policy if exists "public delete sticker_assets" on sticker_assets;
create policy "public delete sticker_assets" on sticker_assets for delete using (true);

-- Allow semua operasi untuk preset_templates
drop policy if exists "public read preset_templates" on preset_templates;
create policy "public read preset_templates" on preset_templates for select using (true);
drop policy if exists "public insert preset_templates" on preset_templates;
create policy "public insert preset_templates" on preset_templates for insert with check (true);
drop policy if exists "public update preset_templates" on preset_templates;
create policy "public update preset_templates" on preset_templates for update using (true);
drop policy if exists "public delete preset_templates" on preset_templates;
create policy "public delete preset_templates" on preset_templates for delete using (true);

-- Allow semua operasi untuk photo_strips
drop policy if exists "public read photo_strips" on photo_strips;
create policy "public read photo_strips" on photo_strips for select using (true);
drop policy if exists "public insert photo_strips" on photo_strips;
create policy "public insert photo_strips" on photo_strips for insert with check (true);
drop policy if exists "public delete photo_strips" on photo_strips;
create policy "public delete photo_strips" on photo_strips for delete using (true);

-- Index untuk performa query foto
create index if not exists photo_strips_created_at_idx on photo_strips (created_at desc);

-- ── 7. Tabel akun operator dan admin ──
create table if not exists booth_users (
  id              text primary key,
  username        text unique not null,
  pin_or_password text not null,
  role            text not null check (role in ('admin', 'operator')),
  display_name    text not null,
  created_at      timestamptz default now()
);

-- Enable RLS
alter table booth_users enable row level security;

-- Policy for select (internal reading by the app client during login)
drop policy if exists "public read booth_users" on booth_users;
create policy "public read booth_users" on booth_users for select using (true);
drop policy if exists "public write booth_users" on booth_users;
create policy "public write booth_users" on booth_users for insert with check (true);

-- Seeder data default untuk operator dan admin
insert into booth_users (id, username, pin_or_password, role, display_name)
values 
  ('usr_admin', 'admin', 'admin123', 'admin', 'Super Admin'),
  ('usr_op_budi', 'budi', '1234', 'operator', 'Budi Santoso'),
  ('usr_op_siti', 'siti', '5678', 'operator', 'Siti Rahma'),
  ('usr_op_ani', 'ani', '1111', 'operator', 'Ani Wijaya')
on conflict (id) do update set
  pin_or_password = excluded.pin_or_password,
  role = excluded.role,
  display_name = excluded.display_name;
