-- Supabase migration (draft)
-- This script assumes a fresh database.

create extension if not exists pgcrypto;

create type survey_status as enum ('draft', 'live', 'closed');
create type cohort_status as enum ('draft', 'open', 'closed');
create type link_status as enum ('closed', 'open');
create type question_type as enum ('text', 'number', 'select', 'multiselect', 'longtext');

create type public_survey_bundle as (
  study jsonb,
  survey jsonb,
  cohort jsonb,
  link jsonb,
  sections jsonb
);

create table studies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  host_name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table study_cohorts (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references studies(id) on delete cascade,
  name text not null,
  status cohort_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table surveys (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references studies(id) on delete cascade,
  name text not null,
  status survey_status not null default 'draft',
  contact_info_mode text not null default 'optional',
  contact_info_placement text not null default 'end',
  is_template boolean not null default false,
  created_at timestamptz not null default now()
);

create table survey_links (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys(id) on delete cascade,
  cohort_id uuid not null references study_cohorts(id) on delete cascade,
  public_slug text not null unique,
  status link_status not null default 'closed',
  opens_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz not null default now()
);

create table survey_sections (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys(id) on delete cascade,
  title text not null,
  sort_order int not null default 0
);

create table survey_questions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references survey_sections(id) on delete cascade,
  type question_type not null,
  label text not null,
  helper_text text,
  required boolean not null default false,
  repeat_group_key text,
  sort_order int not null default 0,
  config_json jsonb not null default '{}'::jsonb
);

create table survey_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references survey_questions(id) on delete cascade,
  value text not null,
  label text not null,
  sort_order int not null default 0
);

create table responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys(id) on delete cascade,
  cohort_id uuid not null references study_cohorts(id) on delete cascade,
  survey_link_id uuid not null references survey_links(id) on delete cascade,
  anon_token text not null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  contact_name text,
  contact_email text,
  contact_phone text,
  business_name text
);

create table response_items (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references responses(id) on delete cascade,
  question_id uuid not null references survey_questions(id) on delete cascade,
  repeat_index int not null default 0,
  value_text text,
  value_number numeric,
  value_json jsonb
);

create table response_audit_log (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references responses(id) on delete cascade,
  editor_id uuid not null,
  edited_at timestamptz not null default now(),
  field_path text not null,
  old_value jsonb,
  new_value jsonb,
  reason text not null
);

create table staff_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index idx_surveys_study_id on surveys(study_id);
create index idx_cohorts_study_id on study_cohorts(study_id);
create index idx_links_survey_id on survey_links(survey_id);
create index idx_links_cohort_id on survey_links(cohort_id);
create index idx_sections_survey_id on survey_sections(survey_id);
create index idx_questions_section_id on survey_questions(section_id);
create index idx_options_question_id on survey_question_options(question_id);
create index idx_responses_survey_id on responses(survey_id);
create index idx_responses_cohort_id on responses(cohort_id);
create index idx_responses_link_id on responses(survey_link_id);
create index idx_items_response_id on response_items(response_id);

create or replace function is_staff()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from staff_users su where su.user_id = auth.uid()
  );
$$;

create or replace function public_slug()
returns text
language sql
stable
as $$
  select nullif(current_setting('app.public_slug', true), '');
$$;

create or replace function audit_reason()
returns text
language sql
stable
as $$
  select nullif(current_setting('app.audit_reason', true), '');
$$;

create or replace function is_service_role()
returns boolean
language sql
stable
as $$
  select current_setting('request.jwt.claim.role', true) = 'service_role';
$$;

create or replace function edit_response_item(
  p_item_id uuid,
  p_value_text text,
  p_value_number numeric,
  p_value_json jsonb,
  p_reason text
) returns void
language plpgsql
security definer
as $$
declare
  v_response_id uuid;
  v_old jsonb;
  v_new jsonb;
begin
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'Reason is required';
  end if;

  perform set_config('app.audit_reason', p_reason, true);

  select response_id,
         jsonb_build_object(
           'value_text', value_text,
           'value_number', value_number,
           'value_json', value_json
         )
  into v_response_id, v_old
  from response_items
  where id = p_item_id;

  update response_items
  set value_text = p_value_text,
      value_number = p_value_number,
      value_json = p_value_json
  where id = p_item_id;

  v_new := jsonb_build_object(
    'value_text', p_value_text,
    'value_number', p_value_number,
    'value_json', p_value_json
  );

  insert into response_audit_log (
    response_id, editor_id, field_path, old_value, new_value, reason
  ) values (
    v_response_id, auth.uid(), 'response_items.' || p_item_id::text, v_old, v_new, p_reason
  );
end;
$$;

create or replace function edit_response_contact(
  p_response_id uuid,
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text,
  p_business_name text,
  p_reason text
) returns void
language plpgsql
security definer
as $$
declare
  v_old jsonb;
  v_new jsonb;
begin
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'Reason is required';
  end if;

  perform set_config('app.audit_reason', p_reason, true);

  select jsonb_build_object(
           'contact_name', contact_name,
           'contact_email', contact_email,
           'contact_phone', contact_phone,
           'business_name', business_name
         )
  into v_old
  from responses
  where id = p_response_id;

  update responses
  set contact_name = p_contact_name,
      contact_email = p_contact_email,
      contact_phone = p_contact_phone,
      business_name = p_business_name
  where id = p_response_id;

  v_new := jsonb_build_object(
    'contact_name', p_contact_name,
    'contact_email', p_contact_email,
    'contact_phone', p_contact_phone,
    'business_name', p_business_name
  );

  insert into response_audit_log (
    response_id, editor_id, field_path, old_value, new_value, reason
  ) values (
    p_response_id, auth.uid(), 'responses.contact_info', v_old, v_new, p_reason
  );
end;
$$;

create or replace function get_public_survey_bundle(p_slug text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_link record;
  v_result jsonb;
begin
  perform set_config('app.public_slug', p_slug, true);

  select sl.id as link_id,
         sl.public_slug,
         sl.status as link_status,
         sl.opens_at,
         sl.closes_at,
         s.id as survey_id,
         s.name as survey_name,
         s.contact_info_mode,
         s.contact_info_placement,
         st.id as study_id,
         st.name as study_name,
         st.host_name,
         st.description,
         c.id as cohort_id,
         c.name as cohort_name
  into v_link
  from survey_links sl
  join surveys s on s.id = sl.survey_id
  join studies st on st.id = s.study_id
  join study_cohorts c on c.id = sl.cohort_id
  where sl.public_slug = p_slug
    and sl.status = 'open'
    and (sl.opens_at is null or sl.opens_at <= now())
    and (sl.closes_at is null or sl.closes_at >= now())
  limit 1;

  if not found then
    return null;
  end if;

  v_result := jsonb_build_object(
    'study', jsonb_build_object(
      'id', v_link.study_id,
      'name', v_link.study_name,
      'host_name', v_link.host_name,
      'description', v_link.description
    ),
    'survey', jsonb_build_object(
      'id', v_link.survey_id,
      'name', v_link.survey_name,
      'contact_info_mode', v_link.contact_info_mode,
      'contact_info_placement', v_link.contact_info_placement
    ),
    'cohort', jsonb_build_object(
      'id', v_link.cohort_id,
      'name', v_link.cohort_name
    ),
    'link', jsonb_build_object(
      'id', v_link.link_id,
      'public_slug', v_link.public_slug,
      'status', v_link.link_status,
      'opens_at', v_link.opens_at,
      'closes_at', v_link.closes_at
    ),
    'sections', (
      select jsonb_agg(
        jsonb_build_object(
          'id', ss.id,
          'title', ss.title,
          'sort_order', ss.sort_order,
          'questions', (
            select jsonb_agg(
              jsonb_build_object(
                'id', q.id,
                'type', q.type,
                'label', q.label,
                'helper_text', q.helper_text,
                'required', q.required,
                'repeat_group_key', q.repeat_group_key,
                'sort_order', q.sort_order,
                'config_json', q.config_json,
                'options', (
                  select jsonb_agg(
                    jsonb_build_object(
                      'id', o.id,
                      'value', o.value,
                      'label', o.label,
                      'sort_order', o.sort_order
                    )
                    order by o.sort_order
                  )
                  from survey_question_options o
                  where o.question_id = q.id
                )
              )
              order by q.sort_order
            )
            from survey_questions q
            where q.section_id = ss.id
          )
        )
        order by ss.sort_order
      )
      from survey_sections ss
      where ss.survey_id = v_link.survey_id
    )
  );

  return v_result;
end;
$$;

create or replace function get_public_survey_bundle_typed(p_slug text)
returns public_survey_bundle
language plpgsql
security definer
as $$
declare
  v_json jsonb;
begin
  v_json := get_public_survey_bundle(p_slug);
  if v_json is null then
    return null;
  end if;

  return (v_json->'study',
          v_json->'survey',
          v_json->'cohort',
          v_json->'link',
          v_json->'sections')::public_survey_bundle;
end;
$$;

create or replace function get_staff_survey_bundle(p_slug text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_link record;
  v_result jsonb;
begin
  if not (is_staff() or is_service_role()) then
    raise exception 'Not authorized';
  end if;

  perform set_config('app.public_slug', p_slug, true);

  select sl.id as link_id,
         sl.public_slug,
         sl.status as link_status,
         sl.opens_at,
         sl.closes_at,
         s.id as survey_id,
         s.name as survey_name,
         s.contact_info_mode,
         s.contact_info_placement,
         st.id as study_id,
         st.name as study_name,
         st.host_name,
         st.description,
         c.id as cohort_id,
         c.name as cohort_name
  into v_link
  from survey_links sl
  join surveys s on s.id = sl.survey_id
  join studies st on st.id = s.study_id
  join study_cohorts c on c.id = sl.cohort_id
  where sl.public_slug = p_slug
  limit 1;

  if not found then
    return null;
  end if;

  v_result := jsonb_build_object(
    'study', jsonb_build_object(
      'id', v_link.study_id,
      'name', v_link.study_name,
      'host_name', v_link.host_name,
      'description', v_link.description
    ),
    'survey', jsonb_build_object(
      'id', v_link.survey_id,
      'name', v_link.survey_name,
      'contact_info_mode', v_link.contact_info_mode,
      'contact_info_placement', v_link.contact_info_placement
    ),
    'cohort', jsonb_build_object(
      'id', v_link.cohort_id,
      'name', v_link.cohort_name
    ),
    'link', jsonb_build_object(
      'id', v_link.link_id,
      'public_slug', v_link.public_slug,
      'status', v_link.link_status,
      'opens_at', v_link.opens_at,
      'closes_at', v_link.closes_at
    ),
    'sections', (
      select jsonb_agg(
        jsonb_build_object(
          'id', ss.id,
          'title', ss.title,
          'sort_order', ss.sort_order,
          'questions', (
            select jsonb_agg(
              jsonb_build_object(
                'id', q.id,
                'type', q.type,
                'label', q.label,
                'helper_text', q.helper_text,
                'required', q.required,
                'repeat_group_key', q.repeat_group_key,
                'sort_order', q.sort_order,
                'config_json', q.config_json,
                'options', (
                  select jsonb_agg(
                    jsonb_build_object(
                      'id', o.id,
                      'value', o.value,
                      'label', o.label,
                      'sort_order', o.sort_order
                    )
                    order by o.sort_order
                  )
                  from survey_question_options o
                  where o.question_id = q.id
                )
              )
              order by q.sort_order
            )
            from survey_questions q
            where q.section_id = ss.id
          )
        )
        order by ss.sort_order
      )
      from survey_sections ss
      where ss.survey_id = v_link.survey_id
    )
  );

  return v_result;
end;
$$;

alter table studies enable row level security;
alter table study_cohorts enable row level security;
alter table surveys enable row level security;
alter table survey_links enable row level security;
alter table survey_sections enable row level security;
alter table survey_questions enable row level security;
alter table survey_question_options enable row level security;
alter table responses enable row level security;
alter table response_items enable row level security;
alter table response_audit_log enable row level security;
alter table staff_users enable row level security;

alter table studies force row level security;
alter table study_cohorts force row level security;
alter table surveys force row level security;
alter table survey_links force row level security;
alter table survey_sections force row level security;
alter table survey_questions force row level security;
alter table survey_question_options force row level security;
alter table responses force row level security;
alter table response_items force row level security;
alter table response_audit_log force row level security;
alter table staff_users force row level security;

create policy "staff read studies" on studies for select using (is_staff());
create policy "staff write studies" on studies for insert with check (is_staff());
create policy "staff update studies" on studies for update using (is_staff());

create policy "staff read cohorts" on study_cohorts for select using (is_staff());
create policy "staff write cohorts" on study_cohorts for insert with check (is_staff());
create policy "staff update cohorts" on study_cohorts for update using (is_staff());

create policy "staff read surveys" on surveys for select using (is_staff());
create policy "staff write surveys" on surveys for insert with check (is_staff());
create policy "staff update surveys" on surveys for update using (is_staff());

create policy "staff read survey links" on survey_links for select using (is_staff());
create policy "staff write survey links" on survey_links for insert with check (is_staff());
create policy "staff update survey links" on survey_links for update using (is_staff());

create policy "staff read sections" on survey_sections for select using (is_staff());
create policy "staff write sections" on survey_sections for insert with check (is_staff());
create policy "staff update sections" on survey_sections for update using (is_staff());

create policy "staff read questions" on survey_questions for select using (is_staff());
create policy "staff write questions" on survey_questions for insert with check (is_staff());
create policy "staff update questions" on survey_questions for update using (is_staff());

create policy "staff read options" on survey_question_options for select using (is_staff());
create policy "staff write options" on survey_question_options for insert with check (is_staff());
create policy "staff update options" on survey_question_options for update using (is_staff());

create policy "staff read responses" on responses for select using (is_staff());
create policy "staff update responses" on responses
for update
using (is_staff() and audit_reason() is not null)
with check (is_staff() and audit_reason() is not null);

create policy "staff read response items" on response_items for select using (is_staff());
create policy "staff update response items" on response_items
for update
using (is_staff() and audit_reason() is not null)
with check (is_staff() and audit_reason() is not null);

create policy "staff read audit log" on response_audit_log for select using (is_staff());
create policy "staff insert audit log" on response_audit_log for insert with check (is_staff());

create policy "staff read staff_users" on staff_users for select using (is_staff());
create policy "staff write staff_users" on staff_users for insert with check (is_staff());

create policy "public read survey links by slug" on survey_links
for select
using (
  public_slug() is not null
  and survey_links.public_slug = public_slug()
);

create policy "public read studies by slug" on studies
for select
using (
  public_slug() is not null
  and exists (
    select 1
    from surveys s
    join survey_links sl on sl.survey_id = s.id
    where s.study_id = studies.id
      and sl.public_slug = public_slug()
  )
);

create policy "public read surveys by slug" on surveys
for select
using (
  public_slug() is not null
  and exists (
    select 1
    from survey_links sl
    where sl.survey_id = surveys.id
      and sl.public_slug = public_slug()
  )
);

create policy "public read sections by slug" on survey_sections
for select
using (
  public_slug() is not null
  and exists (
    select 1
    from survey_links sl
    join surveys s on s.id = sl.survey_id
    where s.id = survey_sections.survey_id
      and sl.public_slug = public_slug()
  )
);

create policy "public read questions by slug" on survey_questions
for select
using (
  public_slug() is not null
  and exists (
    select 1
    from survey_links sl
    join surveys s on s.id = sl.survey_id
    join survey_sections ss on ss.survey_id = s.id
    where ss.id = survey_questions.section_id
      and sl.public_slug = public_slug()
  )
);

create policy "public read options by slug" on survey_question_options
for select
using (
  public_slug() is not null
  and exists (
    select 1
    from survey_questions q
    join survey_sections ss on ss.id = q.section_id
    join surveys s on s.id = ss.survey_id
    join survey_links sl on sl.survey_id = s.id
    where q.id = survey_question_options.question_id
      and sl.public_slug = public_slug()
  )
);

create policy "public insert responses" on responses
for insert
with check (
  exists (
    select 1
    from survey_links sl
    where sl.id = responses.survey_link_id
      and sl.survey_id = responses.survey_id
      and sl.cohort_id = responses.cohort_id
      and sl.status = 'open'
      and (sl.opens_at is null or sl.opens_at <= now())
      and (sl.closes_at is null or sl.closes_at >= now())
  )
);

create policy "public insert response items" on response_items
for insert
with check (
  exists (
    select 1
    from responses r
    join survey_links sl on sl.id = r.survey_link_id
    where r.id = response_items.response_id
      and sl.status = 'open'
      and (sl.opens_at is null or sl.opens_at <= now())
      and (sl.closes_at is null or sl.closes_at >= now())
  )
  and exists (
    select 1
    from survey_questions q
    join survey_sections ss on ss.id = q.section_id
    where q.id = response_items.question_id
      and ss.survey_id = (
        select r2.survey_id from responses r2 where r2.id = response_items.response_id
      )
  )
);
