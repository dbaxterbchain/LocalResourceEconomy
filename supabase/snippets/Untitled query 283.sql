select policyname, cmd, roles, with_check, using
from pg_policies
where schemaname = 'public' and tablename in ('responses','survey_links');


select policyname, cmd, roles, with_check, "using"
from pg_policies
where schemaname = 'public'
  and tablename in ('responses','survey_links');
