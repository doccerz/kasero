# Phase 6 — Contracts: Draft, Posting, and Immutability

## Goal
Implement contracts as the operational core of the application.

## Objectives
- Support draft contract creation.
- Support irreversible posting in v1.
- Enforce immutability for protected fields after posting.
- Prevent multiple active or posted contracts for the same space.

## Tasks
### Draft Contract Creation
- Build contract creation when assigning a space to a tenant.
- Support fields for:
  - tenant reference or tenant details
  - space reference
  - contract start date
  - contract end date
  - rent amount
  - billing frequency
  - due date rule
  - deposit
  - advance payments
  - recurring non-rent fees
  - metadata or notes

### Posting Rules
- Implement the posting endpoint and service.
- Enforce one-way transition from draft to posted.
- Lock the following fields after posting:
  - contract start date
  - contract end date
  - rent amount
  - billing frequency
  - due date rule

### Exclusivity and Lifecycle
- Prevent overlapping active or posted contracts for the same space.
- Transition tenants to active on contract start.
- Transition tenants to inactive after contract end.

### Administrative Views
- Build contract list and detail views.
- Highlight the current active contract in the space detail view.
- Display historical contracts for each space.

## Deliverables
- Contract admin APIs
- Draft and posted contract lifecycle
- Immutable-field enforcement
- Space contract history view

## Exit Criteria
- Draft contracts can be posted once.
- Immutable fields are protected after posting.
- A space cannot have multiple active or posted contracts at the same time.
