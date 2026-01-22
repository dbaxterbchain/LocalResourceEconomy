# Resource Flow Collection Sheet Survey

## Structure
- Study: Coffee Shop Waste Systems
- Survey: Resource Flow Collection Sheet
- Host: Circular Earth

## Sections
1. Intro and consent
2. Understanding what you purchase (repeatable group, up to 10)
3. Understanding what you dispose of (repeatable group, up to 7)
4. Contact info (optional or required; start or end)

## Question types
- text
- number
- select
- multiselect
- longtext

## Purchases group (repeatable, max 10)
- material_or_good (text, required) - prompt: Material or good (what is it that you are purchasing)
- volume_per_purchase (text, required) - prompt: Estimated volume per purchase (units, lbs, gallons, cases, etc.)
- price_per_purchase (text, optional) - prompt: Price per purchase ($)
- purchase_frequency (select, required)
  - options: daily, weekly, biweekly, monthly, other
- supplier (text, optional) - prompt: Who is your supplier? (Who do you purchase from?)
- notes (longtext, optional) - prompt: Notes (anything important about this resource)

## Waste streams group (repeatable, max 7)
- waste_stream_name (text, required) - prompt: Please list waste stream
- estimated_volume (text, optional) - prompt: Estimated volume (units/day, bags/day, lbs/week, etc.)
- disposal_method (multiselect, optional) - prompt: Current method of disposal
  - options: landfill, recycling, compost, multiple, other
- hauler_or_service (text, optional) - prompt: Who collects this waste? (hauler or service provider)
- notes (longtext, optional) - prompt: Notes (anything important about this waste stream)

## Contact info (conditional)
- contact_name (text)
- contact_email (text)
- contact_phone (text)
- business_name (text)

## Notes
- Units are free text to reduce friction.
- Participant can add or remove items within the max count.

## Confirmed decisions
- Max items: purchases (10) and waste streams (7). The max is configurable in the survey editor.
- At least one item is required per section.
- "Other" selections prompt a short text input.
- Price per purchase is free text for now.
- Disposal method allows custom entry.
