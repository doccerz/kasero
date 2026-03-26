# Phase 8 — Contract Posting Atomic Workflow

## Goal
Implement the single atomic transaction that creates the initial financial state when a contract is posted.

## Objectives
- Ensure posting generates all required data in one transaction.
- Prevent partial completion.
- Preserve the distinction between deposit, advance payment, and payables.

## Tasks
### Transaction Steps
1. Transition the contract to `posted`.
2. Generate a unique public access code.
3. Create a fund entry for the deposit.
4. Create a payment entry for the advance payment.
5. Generate all recurring payable entries up to the contract end date.
6. Commit the transaction.

### Business Defaults
- Use the default assumption that deposit equals two times monthly rent unless later made configurable.
- Use the default assumption that advance payment equals one times monthly rent unless later made configurable.

### Error Handling and Rollback
- Roll back the entire transaction if any step fails.
- Validate duplicate-code protection and uniqueness guarantees.
- Ensure deposit is not treated as a payment.
- Ensure advance payment reduces amount due.

## Deliverables
- Atomic posting transaction service
- Rollback-safe financial generation workflow
- Public code generation integrated into posting

## Exit Criteria
- Contract posting fully succeeds or fully fails.
- All generated financial entries and public code are consistent with contract terms.
