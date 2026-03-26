# Phase 2 — Database Schema, Migrations, and Invariants

## Goal
Build the schema and encode correctness rules in the database.

## Objectives
- Create all core tables.
- Define constraints and lifecycle support.
- Implement triggers and DB-level business enforcement.
- Prepare migration and initialization routines.

## Tasks
### Schema Design
- Create tables for:
  - settings
  - app version
  - admin users
  - spaces
  - tenants
  - contracts
  - payables
  - payments
  - fund ledger
  - public access codes
  - audit records

### Lifecycle and Soft Delete Support
- Add soft-delete support for spaces.
- Add tenant status and expiration fields.
- Add contract status fields for draft and posted states.
- Add metadata fields where flexible extension is needed.

### Constraints and Invariants
- Prevent overlapping active or posted contracts for the same space.
- Protect immutable fields after contract posting.
- Enforce uniqueness and revocability requirements for public access codes.
- Ensure no hard deletes for core records.
- Support auditable payment void behavior.

### Triggers and Computed Behavior
- Implement tenant expiration behavior on transition to inactive.
- Clear tenant expiration on transition to active.
- Prepare support for automatic tenant inactivation when contract end dates pass.

### Migration and Initialization
- Configure startup migration execution.
- Implement idempotent seed behavior for:
  - default settings
  - seeded admin user
  - application version row

## Deliverables
- Initial schema definition
- Migration scripts
- Seed scripts
- Database constraints and triggers

## Exit Criteria
- A clean database can be created from migrations.
- Re-running startup initialization does not duplicate seeded records.
- Critical invariants are enforced by the database.
