select polname, with_check
from pg_policies
where schemaname = 'public' and tablename = 'responses';

select public_link_is_open(
  '<survey_link_id>',
  '<survey_id>',
  '<cohort_id>'
);
