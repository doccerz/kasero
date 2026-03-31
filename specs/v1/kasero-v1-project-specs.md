# Apartment Rental Application — Unified v1 Specification

## Purpose
This document is the authoritative, unified specification for **v1** of the Apartment Rental Application. It merges the project plan and the technical specification into a single implementation-ready reference.

The goals of this document are to:
- define the v1 scope clearly,
- lock business rules and invariants,
- reduce ambiguity during implementation,
- separate confirmed v1 behavior from intentionally deferred items.

UI/UX design details, final schema design, and ORM wiring remain implementation concerns unless explicitly constrained here.

---

## 1. Product Scope and Positioning
- **Product type**: internal company application, not a multi-tenant SaaS product.
- **Primary users**:
  - internal landlord/admin users who are authenticated,
  - tenants who do **not** log in and only access limited public views through a link or code.
- **Data model style**: shared application data for internal users.
- **Access model in v1**: single seeded **ADMIN** user. Role expansion is deferred.

---

## 2. High-Level Architecture
### 2.1 Stack
- **Frontend**: Next.js
- **Backend**: NestJS monolith
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: admin-only for internal access
- **Public access**: frontend-mediated only

### 2.2 Architectural Principles
- The **database** is the primary enforcement layer for correctness and business invariants.
- The **backend is never publicly exposed**.
- The **frontend owns all public routing** and mediates tenant-facing requests.
- The ORM should remain **thin and explicit**.
- Avoid premature abstractions in v1.

---

## 3. Roles and Access Control
### 3.1 v1 Roles
- The only supported role in v1 is **ADMIN**.
- One admin account is seeded on first run.
- The admin can access all administrative endpoints.

### 3.2 Future Direction
- Broader RBAC is part of the product direction, but all role expansion, permission matrices, and delegated access are **out of scope for v1**.

---

## 4. Configuration and Runtime Settings
### 4.1 Settings Table
The application uses a generic key-value settings table for runtime policies and feature flags.

Example setting:
- `tenant.hide_expired = true` (default)

### 4.2 Behavior
- Settings are loaded during application startup.
- Settings are cached in memory.
- Settings may be referenced directly in query logic.

### 4.3 Purpose
- Avoid hardcoded business policies.
- Allow policy changes without schema migrations.

---

## 5. Core Domain Model
### 5.1 Spaces
A **Space** is a rentable slot or unit.

#### Fields
- Name
- Description
- Metadata (JSON / flexible extension field)
- Vacancy/occupancy state is **derived**, not stored as authoritative state

#### Rules
- Spaces support CRUD by internal admin users.
- Soft delete only; no hard delete.
- A space may have multiple historical contracts.
- A space may have **only one active/posted contract at a time**.

### 5.2 Tenants
A tenant may be created:
- manually by an admin user, or
- through a one-time QR/public link for self-entry.

#### Tenant lifecycle
- New tenant default state:
  - status = `inactive`
  - expiration date = current date + 10 years
- On contract start:
  - status = `active`
  - expiration date = `NULL`
- On tenant departure or contract end:
  - status = `inactive`
  - expiration date = current date + 10 years

#### Expiration behavior
- Expiration is based on the latest transition to `inactive`.
- Expiration is managed by a database trigger.
- Expiration affects **visibility only**, not record existence.
- Tenants are never hard-deleted.
- Visibility may be governed by configuration such as `tenant.hide_expired`.

#### Duplicate prevention
- Soft duplicate prevention should use a combination of **name + contact information**.
- Same-name tenants are allowed if contact information differs.

### 5.3 Contracts
A contract binds a tenant to a space for a given time period and defines the financial terms used to generate payables.

#### Contract lifecycle
1. **Draft**
   - Created when a space is assigned to a tenant.
   - Fully editable.
2. **Posted**
   - Finalized and read-only for core financial and date fields.
   - Represents an active or historical agreement.

Posting is irreversible in v1.

#### Contract fields in v1
- Tenant details / tenant reference
- Space reference
- Contract start date
- Contract end date
- Rent amount
- Billing frequency (monthly default)
- Due date rule
- Deposits
- Advance payments (N months)
- Recurring non-rent fees
- Metadata / notes as needed

#### Post-posting immutability
Once a contract is posted, the following are immutable in v1:
- Contract start date
- Contract end date
- Rent amount
- Billing frequency
- Due date rules

The following remain conceptually mutable for future compatibility, though v1 does not implement full termination workflows:
- Contract status
- Termination-related fields
- Metadata / notes

#### Automatic tenant inactivation
- When a contract end date passes, the tenant automatically transitions to `inactive`.
- The tenant expiration trigger then applies the standard expiration logic.

#### Contract documents
- A markdown contract template with placeholders may be authored manually.
- Legal wording is outside the scope of this document.
- Markdown-to-PDF document generation is deferred to v2.

---

## 6. Financial Model
The system uses **three independent ledgers**.

### 6.1 Payables
Payables represent what the tenant owes based on the contract.

#### Rules
- Generated from contract terms during contract finalization/posting.
- One payable entry per billing period.
- Includes rent and recurring fees.
- Additional manual payables may be supported later.
- Payables accumulate over time.

### 6.2 Payments
Payments represent money actually received.

#### Rules
- Payments are manually encoded by the admin user.
- Each payment stores at least:
  - amount,
  - date (default current date, editable at entry time).
- Payments are append-only.
- Payments cannot be edited after creation.
- Corrections are handled through new entries or void operations.
- Payments are not tied to a specific billing period.
- Payments can be voided, and void actions must be auditable.
- Advance payments are stored in the payments ledger.

### 6.3 Fund
The fund ledger stores balances that are not current payables.

#### Includes
- Security deposits
- Excess payments / overpayments

#### Rules
- Fund balances do **not** reduce amount due.
- Deposits are not treated as payments.

### 6.4 Amount Due Calculation
At any point in time:

```text
amount_due = sum(all payables up to the reference date) - sum(all payments)
```

Rules:
- Negative balances are displayed as zero.
- Any excess should be represented in fund logic rather than as a negative due amount.
- Amount due is computed on demand.

---

## 7. Contract Finalization and Ledger Generation
Contract posting triggers a single atomic process.

### 7.1 Atomic Transaction Flow
1. Transition the contract to `posted`.
2. Generate a unique public access code.
3. Create a fund entry for the deposit.
   - Default business assumption: `2 × monthly rent`, unless implementation settings later override this.
4. Create a payment entry for the advance payment.
   - Typical default: `1 × monthly rent`.
5. Generate all recurring payable entries up to the contract end date.
6. Commit the transaction.

### 7.2 Rules
- Deposit is **not** a payment.
- Advance payment **does** reduce amount due because it is a payment.
- All recurring payables are generated upfront.
- No background jobs are required in v1.
- No materialized views are required in v1.

---

## 8. Public Tenant Access (No Login)
Tenant access is read-only and frontend-mediated.

### 8.1 Tenant Self-Entry Flow
- A tenant may receive a one-time QR/public link to enter personal details.
- The flow includes data privacy consent.
- The QR/link expires:
  - after successful submission, or
  - when the tenant record is already filled.

### 8.2 Tenant Status View
A tenant may access a public read-only financial status page through:
- a direct URL, or
- a code entered on the application homepage.

### 8.3 Visible Information in v1
The public tenant view may show:
- amount due,
- breakdown of charges,
- due date.

No write actions are available from the public tenant view.

### 8.4 Public Access Security Rules
- The frontend calls the backend using the public code.
- The backend resolves the associated contract.
- The backend must confirm the contract is active and valid for public viewing.
- The backend is not directly publicly exposed.
- The public code must be:
  - random / obfuscated,
  - non-guessable,
  - unique,
  - revocable.

---

## 9. Dashboard and Application Views
### 9.1 Dashboard
The dashboard shows all spaces and prioritizes them in this order:
1. overdue tenants,
2. tenants nearing due date,
3. vacant spaces.

### 9.2 Space Detail View
The space detail view contains:
- space header / basic information,
- contracts table,
- current active contract highlighted,
- historical contracts listed.

---

## 10. Dates and Time Handling
- Contract and business dates should be stored as **date-only values** where time-of-day is unnecessary.
- Data is stored in a universal-safe format.
- All input and display behavior should resolve to **Asia/Manila** timezone semantics for user-facing behavior.

---

## 11. API Surface (v1)
### 11.1 Admin Endpoints (Authenticated)
- `/admin/spaces`
- `/admin/tenants`
- `/admin/contracts`
- `/admin/contracts/:id/post`
- `/admin/contracts/:id/ledger`
- `/admin/contracts/:id/payments`
- `/admin/payments/:id/void`

### 11.2 Internal Frontend-Only Endpoint
- `/internal/contracts/public/:code`

### 11.3 API Design Notes
- Response shapes should remain stable.
- DTO-heavy ceremony is intentionally avoided in v1.

---

## 12. Migration, Initialization, and Seeding
### 12.1 Migrations
- Migrations run on application startup using environment variables.
- ORM migration tracking is the source of truth.
- No custom schema-version branching is used.

### 12.2 Idempotent Seeding
The following startup initialization steps must be safe to re-run:
1. insert default application settings,
2. seed the admin user,
3. insert the application version entry.

### 12.3 Version Table
- Indicates the database has been initialized for the application.
- Used for diagnostics only.
- Not used for migration or business-logic branching.

---

## 13. Security and Data Guardrails
- RBAC/service-level authorization is limited to the v1 admin role but must still be enforced consistently.
- Posted contracts are immutable for protected fields.
- Void actions must be auditable.
- No hard deletes for core records.
- Public tenant access is read-only.
- Backend endpoints for internal logic are not publicly exposed.

---

## 14. Testing Expectations
Tests must validate business invariants and edge cases, including:
- prevention of overlapping active contracts for the same space,
- enforcement of posted contract immutability,
- correctness of payable generation counts and billing dates,
- advance payment offsets,
- manual payable handling after posting where supported,
- overpayments flowing into fund logic,
- tenant lifecycle transitions,
- expiration visibility behavior,
- public access code validation,
- correctness of amount due computation.

Testing should prioritize **database-backed correctness** and business-rule enforcement, not only API response matching.

---

## 15. Explicitly Out of Scope for v1
The following items must **not** be implemented as part of v1:
- online payments,
- contract cancellation / pre-termination workflows,
- proration rules,
- remaining-payables handling after early termination,
- deposit refund workflows,
- partial/full refund rules,
- deductions against deposits,
- refund timing and ledger representation,
- reporting and analytics,
- notifications,
- maintenance requests,
- contract PDF generation,
- export features such as CSV/PDF,
- multi-tenant SaaS isolation,
- expanded RBAC/role management.

---

## 16. v2 Candidates
Potential future enhancements include:
- markdown-to-PDF contract generation,
- explicit contract termination flows,
- reporting and summaries,
- role expansion and richer RBAC,
- exports (CSV/PDF),
- deposit refund handling,
- cancellation and proration behavior.

---

## 17. Implementation Notes
Where the original plan and specification overlapped, this document resolves them as follows:
- v1 access control is standardized to a **single ADMIN role**, while future RBAC remains a roadmap concern.
- the financial model is normalized around **payables**, **payments**, and **fund** as separate ledgers,
- tenant public access remains strictly read-only and frontend-mediated,
- contract posting is the central irreversible transition that generates financial state,
- tenant expiration governs visibility rather than deletion.

This document should be treated as the implementation baseline for v1 unless superseded by a later approved revision.
