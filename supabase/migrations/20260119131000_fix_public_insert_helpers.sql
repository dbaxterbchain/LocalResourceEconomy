create or replace function public_link_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.public_link_id', true), '')::uuid;
$$;

create or replace function public_response_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.public_response_id', true), '')::uuid;
$$;

drop policy if exists "public read survey links by id" on survey_links;
create policy "public read survey links by id" on survey_links
  for select
  using (
    public_link_id() is not null
    and survey_links.id = public_link_id()
    and survey_links.status = 'open'
    and (survey_links.opens_at is null or survey_links.opens_at <= now())
    and (survey_links.closes_at is null or survey_links.closes_at >= now())
  );

drop policy if exists "public read responses by id" on responses;
create policy "public read responses by id" on responses
  for select
  using (
    public_response_id() is not null
    and responses.id = public_response_id()
  );

create or replace function public_link_is_open(
  p_link_id uuid,
  p_survey_id uuid,
  p_cohort_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform set_config('app.public_link_id', p_link_id::text, true);

  return exists (
    select 1
    from survey_links sl
    where sl.id = p_link_id
      and sl.survey_id = p_survey_id
      and sl.cohort_id = p_cohort_id
      and sl.status = 'open'
      and (sl.opens_at is null or sl.opens_at <= now())
      and (sl.closes_at is null or sl.closes_at >= now())
  );
end;
$$;

create or replace function public_response_allows_items(
  p_response_id uuid,
  p_question_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_response record;
begin
  perform set_config('app.public_response_id', p_response_id::text, true);

  select survey_link_id, survey_id, cohort_id
  into v_response
  from responses
  where id = p_response_id;

  if not found then
    return false;
  end if;

  return public_link_is_open(v_response.survey_link_id, v_response.survey_id, v_response.cohort_id);
end;
$$;
