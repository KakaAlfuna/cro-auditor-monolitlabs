alter table cro_auditor.audits
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists audits_user_id_idx on cro_auditor.audits (user_id);

drop policy if exists "Allow public read access on audits" on cro_auditor.audits;
drop policy if exists "Allow service role insert on audits" on cro_auditor.audits;

create policy "Users can read own audits"
  on cro_auditor.audits
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own audits"
  on cro_auditor.audits
  for insert
  with check (auth.uid() = user_id);

create policy "Service role full access on audits"
  on cro_auditor.audits
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
