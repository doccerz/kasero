# v1 Out-of-Scope Guardrails

## Do Not Build in v1
- online payments
- contract cancellation or pre-termination workflows
- proration rules
- remaining-payables logic after early termination
- deposit refund workflows
- refund timing and ledger representation
- deductions against deposits
- reporting and analytics
- notifications
- maintenance requests
- contract PDF generation
- export features such as CSV or PDF export
- multi-tenant SaaS isolation
- expanded RBAC and role management

## Scope Control Guidance
- If a requirement depends on contract cancellation, proration, or refunds, defer it.
- If a requirement introduces analytics or reporting summaries, defer it.
- If a requirement requires tenant write actions beyond self-entry, defer it.
- If a requirement requires multiple user roles, defer it.

## Change Management Recommendation
When a new request appears during delivery, classify it as one of the following:
- required to satisfy an explicit v1 invariant
- implementation detail needed to complete approved v1 scope
- enhancement candidate for v2

Only the first two categories should enter the active v1 sprint plan.
