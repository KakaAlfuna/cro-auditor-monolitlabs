alter table cro_auditor.audits
  add column if not exists lab_lcp_ms integer,
  add column if not exists lab_fcp_ms integer,
  add column if not exists lab_cls_score numeric(5, 3),
  add column if not exists lab_tbt_ms integer;

update cro_auditor.audits
set
  lab_lcp_ms = lcp_ms,
  lab_fcp_ms = fcp_ms
where lab_lcp_ms is null and (lcp_ms is not null or fcp_ms is not null);
