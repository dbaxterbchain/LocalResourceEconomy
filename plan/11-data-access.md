# Data Access (SQL + RPC Examples)

This document provides query and RPC examples for the survey system.

## Public access

### Fetch a survey bundle by slug (open only)
```sql
select get_public_survey_bundle_typed('coffee-shop-waste-systems-spring-2026-resource-flow');
```

**Client example (Supabase JS):**
```ts
const { data, error } = await supabase.rpc('get_public_survey_bundle_typed', {
  p_slug: 'coffee-shop-waste-systems-spring-2026-resource-flow',
})
```

### Insert a response (public)
```sql
insert into responses (survey_id, cohort_id, survey_link_id, anon_token)
values ('<survey_id>', '<cohort_id>', '<survey_link_id>', '<random_token>');
```

### Insert response items (public)
```sql
insert into response_items (response_id, question_id, repeat_index, value_text)
values ('<response_id>', '<question_id>', 0, 'Coffee beans');
```

## Staff access

### Fetch a survey bundle for preview (any slug)
```sql
select get_staff_survey_bundle('coffee-shop-waste-systems-spring-2026-resource-flow');
```

**Server call with service role (Netlify function):**
- `get_staff_survey_bundle` allows service role tokens for server-side calls.

### Edit a response item (audit logged)
```sql
select edit_response_item(
  '<response_item_id>',
  'Updated text',
  null,
  null,
  'Corrected unit'
);
```

### Edit contact info (audit logged)
```sql
select edit_response_contact(
  '<response_id>',
  'Jane Smith',
  'jane@example.com',
  '555-555-5555',
  'Example Coffee',
  'Fixed typo in email'
);
```

## Notes
- Public inserts only work when the survey link is open and within its open/close window.
- Staff updates require `app.audit_reason` (set by the RPCs).
- All public reads are slug-scoped via `get_public_survey_bundle_typed`.
