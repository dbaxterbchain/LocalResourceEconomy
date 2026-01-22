alter table surveys
  add column if not exists is_template boolean not null default false;
