<SKIPPED>
# Phase 11 — Dates, Timezone, and Data Semantics

## Goal
Ensure all business date behavior is consistent with date-only storage and Asia/Manila user-facing semantics.

## Objectives
- Use date-only values where time-of-day is unnecessary.
- Normalize API and UI handling of business dates.
- Prevent timezone drift in user-visible behavior.

## Tasks
### Storage Rules
- Store contract and business dates as date-only values where appropriate.
- Use a universal-safe storage format.

### API and Frontend Handling
- Normalize input parsing for dates.
- Normalize output formatting for user-facing views.
- Resolve display behavior using Asia/Manila semantics.

### Edge Case Validation
- Test date boundaries around local day transitions.
- Verify calculations that depend on due dates and contract end dates.
- Verify date-only values do not shift when serialized and deserialized.

## Deliverables
- Date handling conventions
- Timezone-safe API behavior
- Frontend rendering guidelines for dates

## Exit Criteria
- The same business date is preserved across database, backend, and frontend layers.
- User-visible calculations align with Asia/Manila date expectations.
