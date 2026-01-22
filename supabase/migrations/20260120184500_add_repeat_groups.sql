create table survey_repeat_groups (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references survey_sections(id) on delete cascade,
  name text not null,
  repeat_group_key text not null,
  min_items int not null default 1,
  max_items int not null default 10,
  sort_order int not null default 0,
  unique (section_id, repeat_group_key)
);

create index idx_repeat_groups_section_id on survey_repeat_groups(section_id);

alter table survey_questions add column group_id uuid references survey_repeat_groups(id) on delete set null;
create index idx_questions_group_id on survey_questions(group_id);

alter table survey_repeat_groups enable row level security;
alter table survey_repeat_groups force row level security;

create policy "staff read repeat groups" on survey_repeat_groups
  for select using (is_staff());
create policy "staff write repeat groups" on survey_repeat_groups
  for insert with check (is_staff());
create policy "staff update repeat groups" on survey_repeat_groups
  for update using (is_staff());

create policy "public read repeat groups by slug" on survey_repeat_groups
  for select
  using (
    public_slug() is not null
    and exists (
      select 1
      from survey_links sl
      join surveys s on s.id = sl.survey_id
      join survey_sections ss on ss.survey_id = s.id
      where ss.id = survey_repeat_groups.section_id
        and sl.public_slug = public_slug()
    )
  );

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
          'repeat_groups', (
            select jsonb_agg(
              jsonb_build_object(
                'id', rg.id,
                'name', rg.name,
                'repeat_group_key', rg.repeat_group_key,
                'min_items', rg.min_items,
                'max_items', rg.max_items,
                'sort_order', rg.sort_order
              )
              order by rg.sort_order
            )
            from survey_repeat_groups rg
            where rg.section_id = ss.id
          ),
          'questions', (
            select jsonb_agg(
              jsonb_build_object(
                'id', q.id,
                'type', q.type,
                'label', q.label,
                'helper_text', q.helper_text,
                'required', q.required,
                'repeat_group_key', q.repeat_group_key,
                'group_id', q.group_id,
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
          'repeat_groups', (
            select jsonb_agg(
              jsonb_build_object(
                'id', rg.id,
                'name', rg.name,
                'repeat_group_key', rg.repeat_group_key,
                'min_items', rg.min_items,
                'max_items', rg.max_items,
                'sort_order', rg.sort_order
              )
              order by rg.sort_order
            )
            from survey_repeat_groups rg
            where rg.section_id = ss.id
          ),
          'questions', (
            select jsonb_agg(
              jsonb_build_object(
                'id', q.id,
                'type', q.type,
                'label', q.label,
                'helper_text', q.helper_text,
                'required', q.required,
                'repeat_group_key', q.repeat_group_key,
                'group_id', q.group_id,
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
