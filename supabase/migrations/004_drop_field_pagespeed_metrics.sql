alter table cro_auditor.audits
  drop column if exists field_lcp_ms,
  drop column if exists field_inp_ms,
  drop column if exists field_cls_score;
