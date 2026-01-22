# Wireframes (Draft)

## Participant flow (mobile first)

### Section intro
```
+--------------------------------------+
| Understanding what you purchase       |
| We'll ask about your top purchases.   |
| You can add up to 10.                 |
|                                      |
| [ Start section ]                     |
+--------------------------------------+
```

### Landing
```
+--------------------------------------+
| Coffee Shop Waste Systems            |
| Resource Flow Collection Sheet       |
| Host: Circular Earth                 |
| Cohort: Spring 2026 (if set)         |
|                                      |
| Consent text summary...              |
|                                      |
| [ Start Survey ]                     |
+--------------------------------------+
```

### Contact info (start, if required)
```
+--------------------------------------+
| Contact info                          |
| Name                                 |
| [___________________________]        |
| Email                                |
| [___________________________]        |
| Phone (optional)                     |
| [___________________________]        |
| Business name                        |
| [___________________________]        |
| [ Continue ]                         |
+--------------------------------------+
```

### Question screen (single step)
```
+--------------------------------------+
| Purchases (Resource 2 of 10)         |
| Progress: [####------] 40%           |
|                                      |
| What are you purchasing?             |
| [___________________________]        |
|                                      |
| Hint: Example coffee, milk, cups     |
|                                      |
| [ Back ]                  [ Next ]   |
+--------------------------------------+
```

### Purchase detail flow (per resource)
```
Resource fields (one per screen, in order):
1) Material or good
2) Estimated volume per purchase
3) Price per purchase
4) Frequency of purchase
5) Supplier
6) Notes
```

### Repeat group add/remove
```
+--------------------------------------+
| Purchases list                       |
| 1. Coffee beans                      |
| 2. Milk                              |
| 3. Cups                              |
|                                      |
| [ + Add purchase ]                   |
| [ Continue ]                         |
+--------------------------------------+
```

### Disposal method (with "Other" detail)
```
+--------------------------------------+
| Current method of disposal           |
| [ ] Landfill                          |
| [ ] Recycling                         |
| [ ] Compost                           |
| [ ] Multiple                          |
| [ ] Other                             |
| If Other: [____________________]      |
| [ Back ]                  [ Next ]   |
+--------------------------------------+
```

### Waste stream detail flow (per item)
```
Waste stream fields (one per screen, in order):
1) Waste stream name
2) Estimated volume
3) Current disposal method
4) Who collects this waste
5) Notes
```

### Review section
```
+--------------------------------------+
| Review purchases                      |
| 1. Coffee beans                       |
|    Vol: 25 lbs  Price: $120           |
| 2. Milk                               |
|    Vol: 10 gal  Price: $35            |
|                                      |
| [ Edit item ]                         |
| [ Continue ]                          |
+--------------------------------------+
```

### Review
```
+--------------------------------------+
| Review                               |
| Purchases (10)                       |
| Waste streams (6)                    |
|                                      |
| [ Edit purchases ]                   |
| [ Edit waste streams ]               |
|                                      |
| [ Submit ]                           |
+--------------------------------------+
```

### Contact info (end, if configured)
```
+--------------------------------------+
| Stay in touch?                       |
| Name (optional)                      |
| [___________________________]        |
| Email (optional)                     |
| [___________________________]        |
| [ Submit ]                           |
+--------------------------------------+
```

### Thank you
```
+--------------------------------------+
| Thank you                            |
| Your response is submitted.          |
|                                      |
| [ Done ]                             |
+--------------------------------------+
```

## Research team flow (desktop first)

### Login
```
+--------------------------------------+
| Circular Earth Research Login        |
| Email                                |
| [___________________________]        |
| Password                             |
| [___________________________]        |
| [ Sign in ]                          |
+--------------------------------------+
```

### Study hub
```
+---------------------------------------------------------------+
| Study: Coffee Shop Waste Systems      Host: Circular Earth     |
|---------------------------------------------------------------|
| Surveys                     | Cohorts                         |
| - Resource Flow Collection  | - Spring 2026   (Open)           |
| - Future Survey A           | - Fall 2026     (Draft)          |
| [ + New Survey ]            | [ + New Cohort ]                 |
+---------------------------------------------------------------+
```

### Survey builder
```
+---------------------------------------------------------------+
| Survey: Resource Flow Collection Sheet                         |
|---------------------------------------------------------------|
| Sections                 | Questions                           |
| Intro                    | Consent text                         |
| Purchases (repeatable)   | Material or good (text)              |
| Waste streams (repeatable)| Estimated volume (text)             |
| Contact info             | Purchase frequency (select)          |
| [ + Section ]            | [ + Question ]                       |
|                           | [ Set repeat group ]                |
+---------------------------------------------------------------+
```

### Cohort creation
```
+---------------------------------------------------------------+
| New cohort                                                     |
| Name: [ Spring 2026 ]                                          |
| Status: [ Draft ]                                              |
| Notes: [___________________________________________]           |
| [ Create cohort ]                                              |
+---------------------------------------------------------------+
```

### Cohort + distribution
```
+---------------------------------------------------------------+
| Cohort: Spring 2026                                            |
| Survey: Resource Flow Collection Sheet                         |
| Status: Open                                                   |
| Public link: https://example/s/rfc?c=spring-2026                |
| [ Copy link ]  [ View QR ]  [ Close link ]                     |
+---------------------------------------------------------------+
```

### Responses list
```
+---------------------------------------------------------------+
| Responses                                                     |
| Filters: Survey [RFC] Cohort [Spring 2026] Date [Any]          |
|---------------------------------------------------------------|
| Submitted      Contact (if any)   Status   Actions            |
| 2026-01-18     j.smith@email.com  Submitted [ View ]           |
| 2026-01-18     (anonymous)        Submitted [ View ]           |
+---------------------------------------------------------------+
```

### Response detail + audit log
```
+---------------------------------------------------------------+
| Response detail                                                |
| Purchases: Coffee beans, Milk, Cups...                         |
| Waste streams: Grounds, Cardboard...                           |
| [ Edit response ]                                              |
|---------------------------------------------------------------|
| Audit log                                                      |
| 2026-01-18 14:22  Edited price_per_purchase                     |
| Reason: Corrected currency                                     |
+---------------------------------------------------------------+
```

### Edit response (reason required)
```
+---------------------------------------------------------------+
| Edit response item                                             |
| Field: price_per_purchase                                      |
| Old: $120                                                      |
| New: [ $125 ]                                                  |
| Reason (required): [___________________________]               |
| [ Save ]     [ Cancel ]                                        |
+---------------------------------------------------------------+
```
