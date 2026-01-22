-- Seed data (draft)
-- This is optional demo data for the Coffee Shop Waste Systems study.

with
  new_study as (
    insert into studies (name, host_name, description)
    values (
      'Coffee Shop Waste Systems',
      'Circular Earth',
      'Study on coffee shop resource flows and waste systems.'
    )
    returning id
  ),
  new_cohort as (
    insert into study_cohorts (study_id, name, status, notes)
    select id, 'Spring 2026', 'open', 'Initial pilot cohort.'
    from new_study
    returning id, study_id
  ),
  new_survey as (
    insert into surveys (study_id, name, status, contact_info_mode, contact_info_placement, is_template)
    select id, 'Resource Flow Collection Sheet', 'live', 'optional', 'end', true
    from new_study
    returning id, study_id
  ),
  new_link as (
    insert into survey_links (survey_id, cohort_id, public_slug, status)
    select s.id, c.id, 'coffee-shop-waste-systems-spring-2026-resource-flow', 'open'
    from new_survey s cross join new_cohort c
    returning id
  ),
  sections as (
    insert into survey_sections (survey_id, title, sort_order)
    select s.id, 'Intro and consent', 1 from new_survey s
    union all
    select s.id, 'Understanding what you purchase', 2 from new_survey s
    union all
    select s.id, 'Understanding what you dispose of', 3 from new_survey s
    union all
    select s.id, 'Contact info', 4 from new_survey s
    returning id, title
  ),
  intro_section as (
    select id as section_id from sections where title = 'Intro and consent'
  ),
  purchases_section as (
    select id as section_id from sections where title = 'Understanding what you purchase'
  ),
  waste_section as (
    select id as section_id from sections where title = 'Understanding what you dispose of'
  ),
  contact_section as (
    select id as section_id from sections where title = 'Contact info'
  ),
  purchase_group as (
    insert into survey_repeat_groups (section_id, name, repeat_group_key, min_items, max_items, sort_order)
    select section_id, 'Purchased resources', 'purchases', 1, 10, 1 from purchases_section
    returning id, section_id, repeat_group_key
  ),
  waste_group as (
    insert into survey_repeat_groups (section_id, name, repeat_group_key, min_items, max_items, sort_order)
    select section_id, 'Waste streams', 'waste_streams', 1, 7, 1 from waste_section
    returning id, section_id, repeat_group_key
  ),
  intro_questions as (
    insert into survey_questions (section_id, type, label, helper_text, required, repeat_group_key, group_id, sort_order, config_json)
    select section_id, 'info'::question_type, 'Welcome', 'Please review the consent statement before proceeding.', false, null, null::uuid, 1, '{}'::jsonb from intro_section
    returning id, label
  ),
  purchase_questions as (
    insert into survey_questions (section_id, type, label, helper_text, required, repeat_group_key, group_id, sort_order, config_json)
    select ps.section_id, 'text'::question_type, 'Material or good', 'What are you purchasing?', true, pg.repeat_group_key, pg.id::uuid, 1, '{}'::jsonb
    from purchases_section ps
    cross join purchase_group pg
    union all
    select ps.section_id, 'text'::question_type, 'Estimated volume per purchase', 'Units, lbs, gallons, cases, etc.', true, pg.repeat_group_key, pg.id::uuid, 2, '{}'::jsonb
    from purchases_section ps
    cross join purchase_group pg
    union all
    select ps.section_id, 'text'::question_type, 'Price per purchase', 'Price per purchase ($)', false, pg.repeat_group_key, pg.id::uuid, 3, '{}'::jsonb
    from purchases_section ps
    cross join purchase_group pg
    union all
    select ps.section_id, 'select'::question_type, 'Frequency of purchase', 'Daily, weekly, biweekly, monthly, other', true, pg.repeat_group_key, pg.id::uuid, 4, '{"allow_other_detail": true}'::jsonb
    from purchases_section ps
    cross join purchase_group pg
    union all
    select ps.section_id, 'text'::question_type, 'Supplier', 'Who do you purchase from?', false, pg.repeat_group_key, pg.id::uuid, 5, '{}'::jsonb
    from purchases_section ps
    cross join purchase_group pg
    union all
    select ps.section_id, 'longtext'::question_type, 'Notes', 'Anything important about this resource', false, pg.repeat_group_key, pg.id::uuid, 6, '{}'::jsonb
    from purchases_section ps
    cross join purchase_group pg
    returning id, label
  ),
  waste_questions as (
    insert into survey_questions (section_id, type, label, helper_text, required, repeat_group_key, group_id, sort_order, config_json)
    select ws.section_id, 'text'::question_type, 'Waste stream name', 'Please list waste stream', true, wg.repeat_group_key, wg.id::uuid, 1, '{}'::jsonb
    from waste_section ws
    cross join waste_group wg
    union all
    select ws.section_id, 'text'::question_type, 'Estimated volume', 'Units/day, bags/day, lbs/week, etc.', false, wg.repeat_group_key, wg.id::uuid, 2, '{}'::jsonb
    from waste_section ws
    cross join waste_group wg
    union all
    select ws.section_id, 'multiselect'::question_type, 'Current method of disposal', 'Landfill, recycling, compost, multiple, other', false, wg.repeat_group_key, wg.id::uuid, 3, '{"allow_other_detail": true}'::jsonb
    from waste_section ws
    cross join waste_group wg
    union all
    select ws.section_id, 'text'::question_type, 'Who collects this waste', 'Hauler or service provider', false, wg.repeat_group_key, wg.id::uuid, 4, '{}'::jsonb
    from waste_section ws
    cross join waste_group wg
    union all
    select ws.section_id, 'longtext'::question_type, 'Notes', 'Anything important about this waste stream', false, wg.repeat_group_key, wg.id::uuid, 5, '{}'::jsonb
    from waste_section ws
    cross join waste_group wg
    returning id, label
  ),
  contact_questions as (
    insert into survey_questions (section_id, type, label, helper_text, required, repeat_group_key, group_id, sort_order, config_json)
    select section_id, 'text'::question_type, 'Contact name', 'Optional', false, null, null::uuid, 1, '{}'::jsonb from contact_section
    union all
    select section_id, 'text'::question_type, 'Contact email', 'Optional', false, null, null::uuid, 2, '{}'::jsonb from contact_section
    union all
    select section_id, 'text'::question_type, 'Contact phone', 'Optional', false, null, null::uuid, 3, '{}'::jsonb from contact_section
    union all
    select section_id, 'text'::question_type, 'Business name', 'Optional', false, null, null::uuid, 4, '{}'::jsonb from contact_section
    returning id, label
  ),
  purchase_frequency_question as (
    select id from purchase_questions where label = 'Frequency of purchase'
  ),
  disposal_method_question as (
    select id from waste_questions where label = 'Current method of disposal'
  )
insert into survey_question_options (question_id, value, label, sort_order)
select id, 'daily', 'Daily', 1 from purchase_frequency_question
union all
select id, 'weekly', 'Weekly', 2 from purchase_frequency_question
union all
select id, 'biweekly', 'Biweekly', 3 from purchase_frequency_question
union all
select id, 'monthly', 'Monthly', 4 from purchase_frequency_question
union all
select id, 'other', 'Other', 5 from purchase_frequency_question
union all
select id, 'landfill', 'Landfill', 1 from disposal_method_question
union all
select id, 'recycling', 'Recycling', 2 from disposal_method_question
union all
select id, 'compost', 'Compost', 3 from disposal_method_question
union all
select id, 'multiple', 'Multiple', 4 from disposal_method_question
union all
select id, 'other', 'Other', 5 from disposal_method_question;
