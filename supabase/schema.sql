-- YuTara Marketplace — Agency-Assisted Land Transaction Platform
-- Schema v2: agency-assisted transfer workflow, document management,
-- saved properties, notifications, and role-based access.

-- Core collections (existing, retained)
create table if not exists public."yutara-properties" (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public."yutara-reservations" (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public."yutara-transactions" (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public."yutara-inquiries" (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public."yutara-verifications" (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public."yutara-profiles" (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public."yutara-theme" (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- New: Saved properties (user bookmarks)
create table if not exists public."yutara-saved-properties" (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- New: Document requirements (dynamic per transaction)
create table if not exists public."yutara-document-requirements" (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- New: Transaction documents (uploaded files + versions)
create table if not exists public."yutara-transaction-documents" (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- New: Processing stages (configurable workflow)
create table if not exists public."yutara-processing-stages" (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- New: Stage history / audit trail
create table if not exists public."yutara-stage-history" (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- New: Notifications
create table if not exists public."yutara-notifications" (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- New: Agency personnel
create table if not exists public."yutara-agency-personnel" (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- New: Audit logs
create table if not exists public."yutara-audit-logs" (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Enable RLS on all tables
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'yutara-properties',
    'yutara-reservations',
    'yutara-transactions',
    'yutara-inquiries',
    'yutara-verifications',
    'yutara-profiles',
    'yutara-theme',
    'yutara-saved-properties',
    'yutara-document-requirements',
    'yutara-transaction-documents',
    'yutara-processing-stages',
    'yutara-stage-history',
    'yutara-notifications',
    'yutara-agency-personnel',
    'yutara-audit-logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "public access" on public.%I', table_name);
    execute format(
      'create policy "public access" on public.%I for all to anon, authenticated using (true) with check (true)',
      table_name
    );
    execute format('grant select, insert, update, delete on public.%I to anon, authenticated', table_name);
  end loop;
end $$;

-- Storage bucket for private transaction documents
insert into storage.buckets (id, name, public)
values ('transaction-documents', 'transaction-documents', false)
on conflict (id) do nothing;
