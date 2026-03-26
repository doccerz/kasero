# Phase 7 — Financial Model & Ledger Implementation

## Goal
Implement the three independent ledgers: payables, payments, and fund.

## Objectives
- Generate and store payables by billing period.
- Record append-only payments with void support.
- Store deposits and overpayments in the fund ledger.
- Compute amount due on demand using the specified formula.

## Tasks
### Payables Ledger
- Create one payable entry per billing period.
- Include rent and recurring non-rent fees.
- Generate the full payable schedule up to contract end date.

### Payments Ledger
- Create manual payment entry flow.
- Store amount and date, with current date as the default.
- Make payments append-only.
- Prevent edits after creation.
- Support auditable void operations.

### Fund Ledger
- Store security deposits as fund entries.
- Store excess payments or overpayments as fund entries.
- Ensure fund balances do not directly reduce amount due.

### Amount Due Calculation
- Compute amount due as:
  - sum of all payables up to the reference date
  - minus sum of all payments
- Display negative results as zero.
- Route excess into fund logic rather than showing negative due.

## Deliverables
- Payables ledger implementation
- Payments ledger implementation
- Fund ledger implementation
- Amount-due computation service

## Exit Criteria
- Ledger records are separated by role and behavior.
- Amount due is accurate for standard, prepaid, and overpaid cases.
- Voids remain auditable.
