# Failed completion of issue-0005

- [plan.md](../0005-missing-modules/plan.md)
- [progress.txt](../0005-missing-modules/progress.txt)

# Failed and blocked QA C1 test cases


| Test Case ID | Description | Tester | Date | Result (Pass/Fail/Blocked) | Notes |
|---|---|---|---|---|---|
| TC-DASH-002 | Overdue status | Claude | 2026-03-29 | BLOCKED | Precondition not met: no space with a posted overdue contract exists in current DB state |
| TC-SPACE-003 | View space details | Claude | 2026-03-29 | FAIL | Findings: Strict mode violation — `getByText(/contracts/i)` matched 3 elements (nav link, section heading "Contracts", "No contracts for this space."); How to replicate: navigate to /admin/spaces, click first space link, assert Contracts section; Expected: single "Contracts" section heading visible; Actual: assertion failed due to ambiguous locator matching 3 elements |
| TC-SPACE-006 | Deleted space rejects contracts | Claude | 2026-03-29 | BLOCKED | Precondition not met: no contract creation UI with space selector exists — cannot verify deleted space exclusion from selection |
| TC-TENANT-006 | Tenant active on contract start | Claude | 2026-03-29 | BLOCKED | Precondition not met: no posted contract with start date ≤ today exists; contract creation UI not yet implemented |
| TC-TENANT-007 | Tenant inactive after contract ends | Claude | 2026-03-29 | BLOCKED | Precondition not met: no expired contract exists in current DB state; contract creation UI not yet implemented |
| TC-CONTRACT-001 | Create draft contract | Claude | 2026-03-29 | BLOCKED | Precondition not met: no contract creation UI exists — Add Contract button not present in /admin/contracts |
| TC-CONTRACT-002 | Edit draft contract | Claude | 2026-03-29 | BLOCKED | Precondition not met: no draft contracts in DB and no contract creation UI implemented |
| TC-CONTRACT-003 | Post contract | Claude | 2026-03-29 | BLOCKED | Precondition not met: no draft contracts exist; no Post Contract button in contract detail page |
| TC-CONTRACT-004 | Posted contract fields locked | Claude | 2026-03-29 | BLOCKED | Precondition not met: no posted contracts in DB; contract creation/posting UI not yet implemented |
| TC-CONTRACT-005 | No two active contracts per space | Claude | 2026-03-29 | BLOCKED | Precondition not met: contract creation UI not yet implemented; cannot verify duplicate contract prevention |
| TC-CONTRACT-006 | Payables generated on post | Claude | 2026-03-29 | BLOCKED | Precondition not met: no posted contracts exist; contract creation/posting UI not yet implemented |
| TC-CONTRACT-007 | Advance payment in ledger | Claude | 2026-03-29 | BLOCKED | Precondition not met: no posted contracts with advance payment; contract creation UI not yet implemented |
| TC-CONTRACT-008 | Deposit in fund (not amount due) | Claude | 2026-03-29 | BLOCKED | Precondition not met: no posted contracts with deposit; contract creation UI not yet implemented |
| TC-LEDGER-001 | View ledger | Claude | 2026-03-29 | BLOCKED | Precondition not met: no posted contract exists; contract creation/posting UI not yet implemented |
| TC-LEDGER-002 | Amount due calculated correctly | Claude | 2026-03-29 | BLOCKED | Precondition not met: no posted contract with payables exists; contract creation/posting UI not yet implemented |
| TC-PAYMENT-001 | Record payment | Claude | 2026-03-29 | BLOCKED | Precondition not met: no posted contract with outstanding balance; also no Record Payment button exists in contract detail page |
| TC-PAYMENT-002 | Record payment missing fields | Claude | 2026-03-29 | BLOCKED | Precondition not met: no Record Payment UI implemented; cannot test form validation |
| TC-PAYMENT-003 | Void payment | Claude | 2026-03-29 | BLOCKED | Precondition not met: no payments exist to void; no Void Payment UI implemented |
| TC-PAYMENT-004 | Cannot re-void a voided payment | Claude | 2026-03-29 | BLOCKED | Precondition not met: no voided payments exist; void payment UI not yet implemented |
| TC-PUBLIC-001 | Tenant views public status | Claude | 2026-03-29 | BLOCKED | Precondition not met: no posted contract exists; no public access code available; contract creation/posting UI not yet implemented |
| TC-PUBLIC-002 | Invalid public link | Claude | 2026-03-29 | FAIL | Findings: Backend returns HTTP 500 instead of 404 for unknown public access codes; frontend renders "An error occurred. Please try again later." instead of "Invalid or expired access code."; How to replicate: navigate to /public/any-invalid-code; Expected: "Invalid or expired" error message; Actual: "An error occurred. Please try again later." |
| TC-PUBLIC-003 | No internal IDs exposed publicly | Claude | 2026-03-29 | BLOCKED | Precondition not met: no posted contract exists; cannot access a valid public status page to verify ID exposure |
| TC-PUBLIC-004 | Tenant self-entry flow | Claude | 2026-03-29 | BLOCKED | Precondition not met: no entry tokens have been issued; contract creation/posting UI not yet implemented |
| TC-INTEGRITY-001 | Timezone consistency | Claude | 2026-03-29 | BLOCKED | Precondition not met: requires contract creation UI to create a contract with today's date; contract creation UI not yet implemented |
| TC-INTEGRITY-002 | Billing period alignment | Claude | 2026-03-29 | BLOCKED | Precondition not met: requires a posted contract with monthly billing; contract creation/posting UI not yet implemented |



# Manual check findings

- Application not launching after `docker compose up -d --build`. localhost:3000 is just blank and loading.
- No errors found in `docker logs <container>`