# Plan: Fix Failing Tests (Unit + Playwright)

## Context

The branch `fix/issue-0008-auth-token-validation` added JWT structure validation to `proxy.ts`. The `isJwtValid()` function checks that:
1. The token has 3 dot-separated parts (header.payload.signature)
2. The payload is valid base64-decodeable JSON
3. If `exp` is present, it's not in the past

However, the test fixtures still use the old `'mock-jwt-token'` string, which has no dots and fails validation. This causes **every** protected admin page visit in Playwright tests to redirect to `/admin/login`, making all authenticated tests fail.

---

## Root Cause

| File | Line | Issue |
|------|------|-------|
| `apps/web/e2e/auth-helper.ts` | 17 | Cookie value `'mock-jwt-token'` — no dots, fails `parts.length !== 3` |
| `apps/web/e2e/admin-login.spec.ts` | 34 | `Set-Cookie: auth_token=mock-jwt-token` — same invalid token |
| `apps/web/e2e/global-setup.ts` | 284, 286 | Mock login endpoint also returns `'mock-jwt-token'` |

---

## Fix

Replace `'mock-jwt-token'` everywhere with a structurally valid mock JWT that passes `isJwtValid()`:

```
eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiJ9.mock
```

This token:
- **Header** (`eyJhbGciOiJub25lIn0`) decodes to `{"alg":"none"}`
- **Payload** (`eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiJ9`) decodes to `{"sub":"1","username":"admin"}` — no `exp` field so expiry check is skipped
- **Signature** (`mock`) — any non-empty third part satisfies the 3-part check
- The signature is never cryptographically verified by `proxy.ts`

---

## Implementation Steps

### Step 1 — Run unit tests first

```bash
npm test   # runs apps/api Jest + apps/web Jest
```

Review output. Expect all unit tests to pass (recent commits already fixed migration spec and profile/void tests).

### Step 2 — Fix mock JWT in 3 files

**File 1:** `apps/web/e2e/auth-helper.ts` line 17
- Replace: `value: 'mock-jwt-token'`
- With: `value: 'eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiJ9.mock'`

**File 2:** `apps/web/e2e/admin-login.spec.ts` line 34
- Replace: `'Set-Cookie': 'auth_token=mock-jwt-token; Path=/; HttpOnly'`
- With: `'Set-Cookie': 'auth_token=eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiJ9.mock; Path=/; HttpOnly'`

**File 3:** `apps/web/e2e/global-setup.ts` lines 284 and 286
- Replace both `'mock-jwt-token'` occurrences with the valid mock JWT

### Step 3 — Run Playwright tests

```bash
cd apps/web
# Stop any Docker containers on port 3000 first (stale server)
npx playwright test --reporter=list
```

### Step 4 — Fix any remaining failures

If specific tests still fail after the JWT fix, investigate individually:
- Read the error from test-results/
- Check if a mock endpoint is missing in global-setup.ts
- Add any missing fixture or handler

### Step 5 — Commit

```bash
# Stage only the 3 modified test files
git add apps/web/e2e/auth-helper.ts apps/web/e2e/admin-login.spec.ts apps/web/e2e/global-setup.ts
git commit -m "fix: use valid mock JWT structure in Playwright test fixtures"
```

---

## Critical Files

| File | Purpose |
|------|---------|
| `apps/web/proxy.ts` | JWT validation logic (do NOT modify — it's correct) |
| `apps/web/e2e/auth-helper.ts` | Injects mock cookie for protected page tests |
| `apps/web/e2e/admin-login.spec.ts` | Login flow test — sets cookie via page.route |
| `apps/web/e2e/global-setup.ts` | Mock API server fixture — login POST handler |

---

## Verification

1. `npm test` → all Jest unit tests pass (API + web)
2. `npx playwright test` in `apps/web` → all/most Playwright tests pass
3. Confirm `proxy.ts:isJwtValid('eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiJ9.mock')` returns `true`:
   - Split: 3 parts ✓
   - `atob('eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiJ9')` = `{"sub":"1","username":"admin"}` ✓
   - No `exp` field → expiry check skipped ✓
