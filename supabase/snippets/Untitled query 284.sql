select
  sl.id as link_id,
  sl.survey_id,
  sl.cohort_id,
  sl.status,
  sl.opens_at,
  sl.closes_at,
  public_link_is_open(sl.id, sl.survey_id, sl.cohort_id) as link_ok
from survey_links sl
where sl.public_slug = 'coffee-shop-waste-systems-spring-2026-resource-flow';
