# Highest-Risk / Highest-Priority Areas

## 1. Database Invariants
Key rules must be enforced below the application layer, especially:
- one active or posted contract per space at a time
- no hard delete for core records
- posted contract field immutability

## 2. Atomic Contract Posting Workflow
Posting is a one-way transition in v1 and generates multiple downstream records:
- public access code
- fund entry for deposit
- payment entry for advance payment
- recurring payables

Any partial failure here is high risk.

## 3. Amount Due Computation
The application must keep payables, payments, and fund balances conceptually separate while still presenting an accurate amount due.

## 4. Tenant Lifecycle Transitions
The system must correctly move tenants between active and inactive states, and apply expiration logic based on inactivity transitions.

## 5. Public Access Security
Public access codes must be:
- random or obfuscated
- non-guessable
- unique
- revocable

The backend must not be directly exposed to the public.

## Risk Mitigation Recommendations
- Validate high-risk flows with database-backed integration tests.
- Build posting workflow tests before UI polish.
- Treat public-code validation and immutability checks as release blockers.
