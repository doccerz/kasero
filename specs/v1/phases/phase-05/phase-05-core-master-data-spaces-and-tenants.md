# Phase 5 — Core Master Data: Spaces & Tenants

## Goal
Implement CRUD and lifecycle behavior for spaces and tenants.

## Objectives
- Support internal admin management of spaces.
- Support admin tenant management and public tenant self-entry preparation.
- Implement lifecycle defaults and visibility rules.

## Tasks
### Spaces
- Build CRUD for spaces.
- Support name, description, and metadata fields.
- Enforce soft delete only.
- Derive occupancy or vacancy from contract state rather than persisting it as the authoritative source.

### Tenants
- Build admin create, read, update, and listing flows.
- Apply default tenant creation behavior:
  - status = inactive
  - expiration date = current date + 10 years
- Prepare for activation and inactivation transitions linked to contract lifecycle.

### Duplicate Handling
- Implement soft duplicate detection using name plus contact information.
- Allow same-name tenants when contact information differs.

### Visibility Rules
- Filter expired tenants based on runtime configuration.
- Preserve tenant records permanently without hard delete.

## Deliverables
- Space admin APIs and views
- Tenant admin APIs and views
- Duplicate warning logic
- Visibility filtering behavior

## Exit Criteria
- Admin users can manage spaces and tenants.
- Duplicate prevention behaves as specified.
- Expiration affects visibility, not record retention.
