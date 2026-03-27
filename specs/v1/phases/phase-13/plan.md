# Phase 13 — Deployment Readiness & Initialization

## Context
Phase 13 ensures the application can be initialized safely from scratch and restarted without side effects. The primary gap found: `seedAppVersion()` is never called in `main.ts` startup — only in the standalone `db:seed` script — so the `app_version` table stays empty in Docker deployments unless the script is run manually. All three seed functions are idempotent but there are no tests proving it. The README needs a deployment checklist and operations runbook.

---

## Tasks

### ✅ Task 1 — Write failing unit tests for seed idempotency (TDD)

**Create** `apps/api/src/database/seed.spec.ts`

Unit tests with a mock DB (no real DB required):

- `seedDefaultSettings()` — calls `onConflictDoNothing()` (no duplicate insert)
- `seedAdminUser()` — calls `onConflictDoNothing()` (no duplicate insert)
- `seedAppVersion()` — inserts when `select` returns `[]`; skips insert when `select` returns an existing row

Mock pattern (mirrors project conventions):
```typescript
const mockDb = {
    select: jest.fn(),
    insert: jest.fn(),
};
jest.mock('./database', () => ({ db: mockDb }));
```

Commit after writing failing tests.

---

### ✅ Task 2 — Fix `apps/api/src/main.ts`: add `seedAppVersion()` to startup

**File**: `apps/api/src/main.ts`

Add `seedAppVersion` to imports and call it after `seedAdminUser`:

```typescript
import { seedDefaultSettings, seedAdminUser, seedAppVersion } from './database/seed';

// in bootstrap():
await seedAppVersion('1.0.0');
```

Version string `'1.0.0'` matches what the standalone `db:seed` script already uses.

Commit after implementation and passing unit tests.

---

### ✅ Task 3 — Write DB-conditional integration tests

**Create or add to** `apps/api/src/database/seed.integration.spec.ts`

Pattern: `(hasDatabaseUrl ? it : it.skip)` — self-skips in CI without DATABASE_URL.

Tests:
- **Clean install**: Run all three seed functions against real DB; assert exactly 1 row inserted in each target table
- **Restart (re-run)**: Run all three seed functions a second time; assert row count is unchanged (no duplicates)
- Cleanup: Use transaction rollback (`BEGIN` / `ROLLBACK`) to leave DB clean after test run

Commit after integration tests pass.

---

### ✅ Task 4 — Update `README.md` with deployment runbook

Add three new sections to `README.md`:

**Environment Variables** — table of all required and optional env vars with defaults and descriptions (already partially documented; formalize it)

**Deployment Checklist** — step-by-step ordered list for first deployment and subsequent upgrades

**Operations Runbook** — three sub-flows:
1. Clean install (first-time setup)
2. Application restart (idempotent startup behavior)
3. Migration-based upgrade (deploy new image with pending migrations)

Commit after README update.

---

### Task 5 — Update CLAUDE.md with learnings

Update `.claude/rules/service-workflows.md` with any new patterns discovered.

Commit, then create PR to staging.

---

## Critical Files

| File | Change |
|------|--------|
| `apps/api/src/main.ts` | Add `seedAppVersion('1.0.0')` call |
| `apps/api/src/database/seed.ts` | No changes needed — already idempotent |
| `apps/api/src/database/seed.spec.ts` | **Create** — unit tests |
| `apps/api/src/database/seed.integration.spec.ts` | **Create** — DB-conditional integration tests |
| `README.md` | Add env vars table, deployment checklist, operations runbook |

---

## Verification

```bash
# Unit tests pass without DB
npm test --workspace=apps/api -- --testPathPattern=seed.spec

# Integration tests self-skip in CI, pass with DB
DATABASE_URL=<local> npm test --workspace=apps/api -- --testPathPattern=seed.integration

# Full test suite still green
npm test

# Smoke test: app starts, seeds on fresh DB, restarts cleanly
docker build -t kasero . && docker run --env-file .env kasero
```
