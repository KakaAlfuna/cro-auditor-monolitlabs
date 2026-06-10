create extension if not exists "pgcrypto";

create schema if not exists cro_auditor;

grant usage on schema cro_auditor to postgres, anon, authenticated, service_role;

grant all on all tables in schema cro_auditor to postgres, service_role;
grant select, insert, update, delete on all tables in schema cro_auditor to anon, authenticated;

alter default privileges in schema cro_auditor
  grant all on tables to postgres, service_role;

alter default privileges in schema cro_auditor
  grant select, insert, update, delete on tables to anon, authenticated;

create table if not exists cro_auditor.audits (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  title text not null default '',
  performance_score integer,
  lcp_ms integer,
  fcp_ms integer,
  total_colors integer not null default 0,
  color_count_warning boolean not null default false,
  colors jsonb not null default '[]'::jsonb,
  font_families jsonb not null default '[]'::jsonb,
  primary_font_family text,
  semantic_markdown text not null default '',
  analysis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audits_created_at_idx on cro_auditor.audits (created_at desc);
create index if not exists audits_url_idx on cro_auditor.audits (url);

alter table cro_auditor.audits enable row level security;

create policy "Allow public read access on audits"
  on cro_auditor.audits
  for select
  using (true);

create policy "Allow service role insert on audits"
  on cro_auditor.audits
  for insert
  with check (true);
