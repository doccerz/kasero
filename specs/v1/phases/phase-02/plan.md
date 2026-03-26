# Phase 2 — Database Schema, Migrations, and Invariants

## Context

Phase 1 delivered: NestJS API skeleton, all 11 Drizzle schema tables in `schema.ts`, one migration file (`0001_constraints_and_triggers.sql`) with partial invariants (one-active-contract-per-space index, tenant expiration trigger), seed functions, startup migration runner, and Dockerfile.

Phase 2 completes the database-level correctness. Three gaps remain:
1. No `0000` CREATE TABLE migration exists — the schema was defined but never generated into SQL.
2. Posted contract immutability and payment void audit triggers are absent.
3. Automatic tenant inactivation support is not prepared.

**New branch:** `feat/phase-02-db-schema-migrations-invariants`

---

## What Already Exists (Do Not Re-implement)

| Already Done | Location |
|---|---|
| All 11 tables + 5 enums in schema.ts | `apps/api/src/database/schema.ts` |
| One-active-contract-per-space unique index | `0001_constraints_and_triggers.sql` |
| Tenant expiration trigger (active↔inactive) | `0001_constraints_and_triggers.sql` |
| Startup migration runner | `apps/api/src/database/migrate.ts` |
| Idempotent seed (settings, admin, version) | `apps/api/src/database/seed.ts` |

---

## Groups

### Group 1 — Generate Initial Schema Migration ✅ COMPLETE

**Goal:** Produce the `0000` migration SQL from the existing `schema.ts` so the DB can be built from scratch.

**Tasks:**
- [x] Run `npm run db:generate --workspace=apps/api` to generate the `0000_*.sql` migration
- [x] Verify it contains all `CREATE TYPE` + `CREATE TABLE` statements for 11 tables and 5 enums
- [x] Verify `npm run db:migrate --workspace=apps/api` succeeds against a clean DB
- [x] Write/extend DB-backed test in `schema.spec.ts` that verifies all tables exist after migration (self-skips without `DATABASE_URL`)
- [x] Commit after tests pass

**Files:**
- `apps/api/drizzle/migrations/0000_lively_electro.sql` ← generated
- `apps/api/src/database/schema.spec.ts`

---

### Group 2 — Contract Immutability Trigger ✅ COMPLETE

**Goal:** Enforce at the DB level that posted contracts' protected fields cannot be changed.

**Protected fields:** `start_date`, `end_date`, `rent_amount`, `billing_frequency`, `due_date_rule`

**Tasks:**
- [x] Write failing DB-backed tests: attempt to UPDATE a protected field on a posted contract → DB raises exception
- [x] Add migration `0002_contract_immutability.sql` with:
  - PL/pgSQL function `prevent_posted_contract_mutation()`
  - Trigger `trg_contract_immutability` — BEFORE UPDATE ON contracts — raises `EXCEPTION` if any protected field changes when `OLD.status = 'posted'`
- [x] Make tests pass
- [x] Commit at each TDD step

**Files:**
- `apps/api/drizzle/migrations/0002_contract_immutability.sql` ← new
- `apps/api/src/database/schema.spec.ts`

---

### Group 3 — No-Hard-Delete Protection ✅ COMPLETE

**Goal:** Prevent hard deletes of core records at the DB level.

**Protected tables:** `tenants`, `contracts`, `payments`, `fund`, `payables`, `public_access_codes`, `audit`

**Tasks:**
- [x] Write failing DB-backed tests: attempt DELETE on each protected table → DB raises exception
- [x] Add migration `0003_no_hard_delete.sql` with:
  - [x] PL/pgSQL function `prevent_hard_delete()`
  - [x] One trigger per protected table: `trg_no_delete_<table>` — BEFORE DELETE — raises `EXCEPTION` with descriptive message
- [x] Spaces are excluded (soft-delete via `deleted_at` is the intentional mechanism)
- [x] Make tests pass
- [x] Commit at each TDD step

**Files:**
- `apps/api/drizzle/migrations/0003_no_hard_delete.sql` ← new
- `apps/api/src/database/schema.spec.ts`

---

### Group 4 — Payment Void Audit Trigger ✅ COMPLETE

**Goal:** Automatically insert an audit record when a payment is voided (`voided_at` transitions from NULL to a timestamp).

**Tasks:**
- [x] Write failing DB-backed tests: set `voided_at` on a payment → audit row inserted with `action='void'`, correct `entity_type='payment'` and `entity_id`
- [x] Add migration `0004_payment_void_audit.sql` with:
  - PL/pgSQL function `record_payment_void()`
  - Trigger `trg_payment_void_audit` — AFTER UPDATE ON payments — fires when `NEW.voided_at IS NOT NULL AND OLD.voided_at IS NULL`
  - Inserts into `audit`: `entity_type='payment'`, `entity_id=NEW.id`, `action='void'`, `metadata=jsonb with amount and contract_id`
- [x] Make tests pass
- [x] Commit at each TDD step

**Files:**
- `apps/api/drizzle/migrations/0004_payment_void_audit.sql` ← new
- `apps/api/src/database/schema.spec.ts`

---

### Group 5 — Tenant Auto-Inactivation Function ✅ COMPLETE

**Goal:** Provide a DB-callable function that inactivates tenants whose contracts have passed their `end_date`. The existing `trg_tenant_expiration` trigger will automatically set `expiration_date = now() + 10 years` after this.

**Tasks:**
- [x] Write failing DB-backed tests: insert contract with past `end_date`, call function, assert tenant status becomes `inactive` and `expiration_date` is set
- [x] Add migration `0005_expire_contract_tenants.sql` with:
  - PL/pgSQL function `expire_contract_tenants()` — updates tenants to `inactive` where their contract `end_date < CURRENT_DATE` and tenant is still `active`
  - Returns count of affected tenants
- [x] No background job needed in v1 — function is prepared for future scheduling
- [x] Make tests pass
- [x] Commit at each TDD step

**Files:**
- `apps/api/drizzle/migrations/0005_expire_contract_tenants.sql` ← new
- `apps/api/src/database/schema.spec.ts`

---

### Group 6 — Integration Verification and PR

**Goal:** Confirm end-to-end correctness before shipping.

**Tasks:**
- Run full test suite: `npm test` — all tests pass (DB tests pass with `DATABASE_URL`, self-skip without)
- Verify clean DB creation: drop DB, re-run migrations from scratch, verify all tables/triggers/functions exist
- Verify seed idempotency: run `npm run db:seed` twice, assert no duplicates
- Commit any fixes
- Create PR to staging: `feat/phase-02-db-schema-migrations-invariants` → `staging`

---

## Critical Files

| File | Role |
|---|---|
| `apps/api/src/database/schema.ts` | Source of truth for all table definitions |
| `apps/api/drizzle/migrations/0000_*.sql` | Initial CREATE TABLE migration (to generate) |
| `apps/api/drizzle/migrations/0001_constraints_and_triggers.sql` | Existing: one-active-contract index + tenant expiration trigger |
| `apps/api/drizzle/migrations/0002_contract_immutability.sql` | New: posted contract immutability trigger |
| `apps/api/drizzle/migrations/0003_no_hard_delete.sql` | New: no-hard-delete triggers |
| `apps/api/drizzle/migrations/0004_payment_void_audit.sql` | New: payment void audit trigger |
| `apps/api/drizzle/migrations/0005_expire_contract_tenants.sql` | New: tenant auto-inactivation function |
| `apps/api/src/database/schema.spec.ts` | DB-backed invariant tests |
| `apps/api/src/database/seed.ts` | Idempotent seed (already done, verify only) |
| `apps/api/src/database/migrate.ts` | Startup migration runner (already done) |

---

## TDD Workflow Per Group

```
Write failing tests → git commit
Implement migration/code → git commit
Pass all tests → git commit
Mark group done → git commit
```

---

## Verification

```bash
# Run all tests (DB tests self-skip without DATABASE_URL)
npm test

# With real DB: run DB-backed invariant tests
DATABASE_URL=<url> npm test --workspace=apps/api

# Verify clean migration from scratch
psql -c "DROP DATABASE kasero_test; CREATE DATABASE kasero_test;"
DATABASE_URL=<url> npm run db:migrate --workspace=apps/api

# Verify seed idempotency
DATABASE_URL=<url> npm run db:seed --workspace=apps/api
DATABASE_URL=<url> npm run db:seed --workspace=apps/api  # second run — no duplicates
```
