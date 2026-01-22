create or replace function public_link_is_open(
  p_link_id uuid,
  p_survey_id uuid,
  p_cohort_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from survey_links sl
    where sl.id = p_link_id
      and sl.survey_id = p_survey_id
      and sl.cohort_id = p_cohort_id
      and sl.status = 'open'
      and (sl.opens_at is null or sl.opens_at <= now())
      and (sl.closes_at is null or sl.closes_at >= now())
  );
$$;

create or replace function public_response_allows_items(
  p_response_id uuid,
  p_question_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from responses r
    join survey_links sl on sl.id = r.survey_link_id
    join survey_questions q on q.id = p_question_id
    join survey_sections ss on ss.id = q.section_id
    where r.id = p_response_id
      and sl.status = 'open'
      and (sl.opens_at is null or sl.opens_at <= now())
      and (sl.closes_at is null or sl.closes_at >= now())
      and ss.survey_id = r.survey_id
  );
$$;

drop policy if exists "public insert responses" on responses;
create policy "public insert responses" on responses
  for insert
  with check (
    public_link_is_open(survey_link_id, survey_id, cohort_id)
  );

drop policy if exists "public insert response items" on response_items;
create policy "public insert response items" on response_items
  for insert
  with check (
    public_response_allows_items(response_id, question_id)
  );
