# Phase 9 — Public Tenant Access (No Login)

## Context
Phase 8 completed the atomic contract posting workflow. Phase 9 exposes two public-facing flows for tenants who do not log in:
1. A **public status view** — tenant views amount due and charge breakdown via a non-guessable code
2. A **tenant self-entry flow** — tenant fills in their personal details via a one-time link

The `PublicAccessModule` (service + controller) exists as a stub. `public_access_codes` schema and code generation (on contract post) are already implemented. The web pages `/public/[code]` and `/entry/[token]` exist as stubs. Next migration slot is `0006`.

---

## Branch
`feat/phase-09-public-tenant-access-no-login`

---

## Implementation Steps (TDD order)

### 1. Schema: Add entry token columns to `tenants` ✅

**File:** `apps/api/src/database/schema.ts`
- Add `entryToken: uuid('entry_token')` (nullable, no default)
- Add `entryTokenUsedAt: timestamp('entry_token_used_at')` (nullable)

**File:** `apps/api/drizzle/migrations/0006_tenant_entry_tokens.sql`
```sql
ALTER TABLE tenants ADD COLUMN entry_token uuid;
ALTER TABLE tenants ADD COLUMN entry_token_used_at timestamp;
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_entry_token ON tenants(entry_token) WHERE entry_token IS NOT NULL;
```

Update `drizzle/migrations/meta/_journal.json` with the new entry.

---

### 2. `LedgersModule`: export `LedgersService` ✅

**File:** `apps/api/src/ledgers/ledgers.module.ts`
- Add `exports: [LedgersService]`

---

### 3. `PublicAccessService` — implement ✅

**File:** `apps/api/src/public-access/public-access.service.ts`

Inject `@Inject(DB_TOKEN) private db` and `private ledgers: LedgersService`.

Methods:
- `getPublicStatus(code: string, referenceDate?: string)`:
  - Query `publicAccessCodes` JOIN `contracts` WHERE `pac.code = code` AND `pac.revokedAt IS NULL` AND `contracts.status = 'posted'`
  - If not found → throw `NotFoundException`
  - Call `this.ledgers.getLedger(contractId, referenceDate)`
  - Return `{ contractId, ledger }`
- `resolveEntryToken(token: string)`:
  - Query `tenants` WHERE `entryToken = token`
  - If not found → throw `NotFoundException`
  - Return `{ tenantId, usedAt: entryTokenUsedAt }` — let controller decide 410 vs 200
- `submitEntry(token: string, body: { firstName, lastName, contactInfo, consentGiven })`:
  - Validate `consentGiven === true` → throw `BadRequestException('Consent required')` if not
  - Find tenant by `entryToken = token` → not found → `NotFoundException`
  - If `entryTokenUsedAt IS NOT NULL` → throw `GoneException('Link already used')`
  - `db.update(tenants).set({ firstName, lastName, contactInfo, entryTokenUsedAt: new Date(), updatedAt: new Date() }).where(eq(tenants.entryToken, token)).returning()`
  - Return updated tenant

---

### 4. `PublicAccessController` — implement ✅

**File:** `apps/api/src/public-access/public-access.controller.ts`

Change `@Controller('public-access')` → `@Controller('internal')`. No `JwtAuthGuard`.

Routes:
- `@Get('contracts/public/:code')` → calls `service.getPublicStatus(code)`
- `@Get('tenants/entry/:token')` → calls `service.resolveEntryToken(token)`, returns 200 (found) or 410 (used)
- `@Post('tenants/entry/:token')` → calls `service.submitEntry(token, body)`, returns 201

---

### 5. `PublicAccessModule` — update ✅

**File:** `apps/api/src/public-access/public-access.module.ts`
- Add `imports: [LedgersModule]`

---

### 6. `TenantsService` — add `generateEntryLink` ✅

**File:** `apps/api/src/tenants/tenants.service.ts`

Method `generateEntryLink(tenantId: string)`:
- Call `findOne(tenantId)` → NotFoundException if missing
- Generate token: `crypto.randomUUID()`
- `db.update(tenants).set({ entryToken: token, entryTokenUsedAt: null, updatedAt: new Date() }).where(eq(tenants.id, tenantId)).returning()`
- Return `{ token }`

---

### 7. `TenantsController` — add entry-link route ✅

**File:** `apps/api/src/tenants/tenants.controller.ts`

- `@Post(':id/entry-link')` (guarded) → calls `service.generateEntryLink(id)`, returns `{ token }`

---

### 8. `ContractsService` — add `revokeAccessCode` ✅

**File:** `apps/api/src/contracts/contracts.service.ts`

Method `revokeAccessCode(contractId: string)`:
- Find contract via `findOne(contractId)` → NotFoundException if missing
- `db.update(publicAccessCodes).set({ revokedAt: new Date() }).where(eq(publicAccessCodes.contractId, contractId)).returning()`
- If empty returning → NotFoundException (no code exists)
- Return updated record

---

### 9. `ContractsController` — add revoke-code route ✅

**File:** `apps/api/src/contracts/contracts.controller.ts`

- `@Post(':id/revoke-code')` (guarded) → calls `service.revokeAccessCode(id)`, returns 200

---

### 10. Tests — API unit tests ✅

**New files:**
- `apps/api/src/public-access/public-access.service.spec.ts`
  - `getPublicStatus`: valid code returns ledger, revoked code throws 404, not-posted contract throws 404
  - `resolveEntryToken`: valid token returns tenant info, unknown token throws 404
  - `submitEntry`: no consent throws 400, unknown token throws 404, used token throws 410, valid submission updates tenant
- `apps/api/src/public-access/public-access.controller.spec.ts`
  - GET `/internal/contracts/public/:code` → 200 with ledger data
  - GET `/internal/tenants/entry/:token` → 200 (valid), 410 (used)
  - POST `/internal/tenants/entry/:token` → 201 on success, 400 on no consent

**Updated files:**
- `apps/api/src/tenants/tenants.service.spec.ts` — add `generateEntryLink` tests
- `apps/api/src/tenants/tenants.controller.spec.ts` — add `POST :id/entry-link` test
- `apps/api/src/contracts/contracts.service.spec.ts` — add `revokeAccessCode` tests
- `apps/api/src/contracts/contracts.controller.spec.ts` — add `POST :id/revoke-code` test

**Integration test:**
- `apps/api/src/public-access/public-access.integration.spec.ts`
  - Uses `(hasDatabaseUrl ? describe : describe.skip)` guard
  - Full flow: post a contract → get code → call `/internal/contracts/public/:code` → validate ledger returned
  - Revocation: post → revoke → try resolve → 404

---

### 11. Web — `/public/[code]` page ✅

**File:** `apps/web/app/public/[code]/page.tsx`

Server component. Params must be awaited (`params: Promise<{ code: string }>`).

```typescript
const res = await fetch(`${process.env.INTERNAL_API_URL}/internal/contracts/public/${code}`, { cache: 'no-store' });
```

Display:
- Amount due (large/prominent)
- Payables table: columns `Period`, `Due Date`, `Amount`
- Fund entries (deposits) section
- Error states: 404 = "Invalid or expired access code", 500 = generic error

---

### 12. Web — `/` homepage ✅

**File:** `apps/web/app/page.tsx`

Client component with a code input form. On submit: `router.push('/public/' + code)`.

---

### 13. Web — `/entry/[token]` page ✅

**File:** `apps/web/app/entry/[token]/page.tsx`

- Server component wrapper: fetches `GET /internal/tenants/entry/:token`
  - 404 → renders "Invalid or expired link" message
  - `usedAt` set → renders "Entry already submitted" message
  - Valid → renders `<EntryForm token={token} />` client component
- `EntryForm` (`'use client'`): firstName, lastName, contactInfo (phone + email fields), privacy consent checkbox; on submit POSTs to `/internal/tenants/entry/:token`; success state shows "Details submitted"

---

### 14. Web — frontend tests ✅

- Update `apps/web/__tests__/` to test new page components are defined/exported (consistent with existing stub test pattern)

---

## Critical Files

| File | Action |
|------|--------|
| `apps/api/src/database/schema.ts` | Add `entryToken`, `entryTokenUsedAt` to `tenants` |
| `apps/api/drizzle/migrations/0006_tenant_entry_tokens.sql` | New migration |
| `apps/api/drizzle/migrations/meta/_journal.json` | Add 0006 entry |
| `apps/api/src/public-access/public-access.service.ts` | Implement service |
| `apps/api/src/public-access/public-access.controller.ts` | Implement controller (path: `internal`) |
| `apps/api/src/public-access/public-access.module.ts` | Import `LedgersModule` |
| `apps/api/src/ledgers/ledgers.module.ts` | Export `LedgersService` |
| `apps/api/src/tenants/tenants.service.ts` | Add `generateEntryLink` |
| `apps/api/src/tenants/tenants.controller.ts` | Add `POST :id/entry-link` |
| `apps/api/src/contracts/contracts.service.ts` | Add `revokeAccessCode` |
| `apps/api/src/contracts/contracts.controller.ts` | Add `POST :id/revoke-code` |
| `apps/web/app/page.tsx` | Code entry form |
| `apps/web/app/public/[code]/page.tsx` | Public status view |
| `apps/web/app/entry/[token]/page.tsx` | Tenant self-entry page |

## Reusable Utilities
- `LedgersService.getLedger()` — `apps/api/src/ledgers/ledgers.service.ts:19`
- `buildMockDb()` pattern — `apps/api/src/contracts/contracts.service.spec.ts:9`
- Transaction rollback cleanup — `apps/api/src/contracts/contracts.integration.spec.ts`
- `hasDatabaseUrl` guard — any `*.integration.spec.ts`

---

## Verification

```bash
# API unit tests
npm test --workspace=apps/api

# API integration tests (requires local DB)
DATABASE_URL=postgres://admin:admin@localhost:5432/kasero_test npm test --workspace=apps/api

# Web tests
npm test --workspace=apps/web

# Manual E2E
# 1. POST /auth/login → get JWT
# 2. POST /admin/tenants/:id/entry-link → get token → open /entry/{token}
# 3. POST /admin/contracts/:id/post (or use existing posted contract) → get code
# 4. GET /internal/contracts/public/{code} → verify ledger
# 5. POST /admin/contracts/:id/revoke-code → GET same code → 404
```

<promise>COMPLETE</promise>
