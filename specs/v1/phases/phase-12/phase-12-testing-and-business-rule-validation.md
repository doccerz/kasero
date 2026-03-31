# Phase 12 — Testing & Business Rule Validation

## Goal
Validate business invariants and edge cases with database-backed tests.

## Objectives
- Prove correctness of database constraints and transactional workflows.
- Cover core financial and lifecycle edge cases.
- Prevent regression in the posting and ledger engine.

## Tasks
### Database and Integration Tests
- Test prevention of overlapping active contracts for the same space.
- Test posted contract immutability.
- Test tenant expiration trigger behavior.
- Test public access code uniqueness and validation.

### Financial Tests
- Test payable generation counts and billing dates.
- Test advance payment offsets.
- Test overpayments flowing into fund logic.
- Test amount due computation for normal, prepaid, and overpaid cases.
- Test manual payable handling if included in implementation.

### Lifecycle and Access Tests
- Test tenant active and inactive transitions.
- Test visibility behavior for expired tenants.
- Test public read-only access restrictions.
- Test payment void audit behavior.

### Test Layers
- Database constraint tests
- Service integration tests
- API integration tests
- Minimal UI smoke tests for critical flows

## Deliverables
- Automated invariant test suite
- Regression tests for posting and ledgers
- Smoke tests for critical user flows

## Exit Criteria
- Critical business rules are protected by automated tests.
- Core workflows are validated at the database and service layers.
