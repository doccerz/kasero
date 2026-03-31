# Plan: Spaces & Tenants CRUD + E2E Test Coverage

## Context

The admin UI currently displays spaces and tenants in read-only tables with no way to create, edit, or delete records. The NestJS backend already exposes full CRUD endpoints (`POST`, `PATCH`, `DELETE` for spaces; `POST`, `PATCH` for tenants). This plan wires up the frontend to those endpoints, fixes a data model mismatch on tenants, and writes E2E Playwright tests verified against the Dockerized stack.

---

## Issues Found

1. **No CRUD UI on Spaces or Tenants pages** — only read-only lists
2. **Tenants data model mismatch** — frontend uses `name`, `email`, `phone` but API uses `firstName`, `lastName`, `contactInfo` (jsonb)
3. **Missing mock fixtures** — `/admin/spaces` and `/admin/tenants` list endpoints not present in `global-setup.ts`
4. **Contracts page stub** — returns "coming soon" text; needs real implementation
5. **Contracts page missing from nav** — currently no nav link to contracts list

---

## Architecture

### Next.js API Routes (proxy layer, matching existing auth pattern)

New routes to create:
- `apps/web/app/api/admin/spaces/route.ts` — `POST` create space
- `apps/web/app/api/admin/spaces/[id]/route.ts` — `PATCH` update, `DELETE` soft-delete
- `apps/web/app/api/admin/tenants/route.ts` — `POST` create tenant
- `apps/web/app/api/admin/tenants/[id]/route.ts` — `PATCH` update

All routes: read `auth_token` cookie → forward as `Authorization: Bearer` header → proxy to `INTERNAL_API_URL`.

### Client Components for CRUD UI

Pattern (matching profile page at `app/admin/(protected)/profile/page.tsx`):
- Page file stays as server component (fetches + passes data as props)
- Extract a `*Client` component (client component) that owns modal state + mutation logic
- After successful mutation → `router.refresh()` to re-render server component

### Modal Pattern

Use a state-based overlay (no external dependency). Tailwind classes only.
Matches existing design: `bg-white rounded-xl border border-slate-200` cards.

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/web/app/api/admin/spaces/route.ts` | POST create space |
| `apps/web/app/api/admin/spaces/[id]/route.ts` | PATCH update, DELETE remove |
| `apps/web/app/api/admin/tenants/route.ts` | POST create tenant |
| `apps/web/app/api/admin/tenants/[id]/route.ts` | PATCH update tenant |
| `apps/web/app/admin/(protected)/spaces/_components/spaces-client.tsx` | CRUD UI (modal + table) |
| `apps/web/app/admin/(protected)/tenants/_components/tenants-client.tsx` | CRUD UI (modal + table) |
| `apps/web/e2e/admin-spaces-crud.spec.ts` | E2E CRUD tests for spaces |
| `apps/web/e2e/admin-tenants-crud.spec.ts` | E2E CRUD tests for tenants |

---

## Files to Modify

| File | Change |
|------|--------|
| `apps/web/app/admin/(protected)/spaces/page.tsx` | Pass `spaces` to `SpacesClient` |
| `apps/web/app/admin/(protected)/tenants/page.tsx` | Fix `Tenant` interface + pass to `TenantsClient` |
| `apps/web/app/admin/(protected)/tenants/[id]/page.tsx` | Fix `Tenant` interface (`firstName`, `lastName`, `contactInfo`) |
| `apps/web/app/admin/(protected)/contracts/page.tsx` | Implement real contracts list (fetch + table) |
| `apps/web/app/admin/_components/admin-nav.tsx` | Add Contracts nav item |
| `apps/web/e2e/global-setup.ts` | Add missing list fixtures + CRUD POST/PATCH/DELETE handlers |

---

## Data Model Fix: Tenants

**Current (wrong):**
```typescript
interface Tenant { id: string; name: string; email: string; phone: string; }
```

**Correct (matching API schema):**
```typescript
interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  contactInfo?: { email?: string; phone?: string; [key: string]: unknown };
}
```

Display: `${tenant.firstName} ${tenant.lastName}`, email from `tenant.contactInfo?.email`, phone from `tenant.contactInfo?.phone`.

---

## CRUD Forms

**Space form fields:**
- `name` — required, text input
- `description` — optional, textarea

**Tenant form fields:**
- `firstName` — required, text input
- `lastName` — required, text input
- `contactInfo.email` — optional, email input
- `contactInfo.phone` — optional, tel input

---

## Mock Server Updates (`global-setup.ts`)

Add fixtures:
```
/admin/spaces  →  [{ id: 'space-1', name: 'Unit 1A', description: '...' }, ...]
/admin/tenants →  [{ id: 'tenant-1', firstName: 'Maria', lastName: 'Santos', contactInfo: { email: '...', phone: '...' } }, ...]
/admin/tenants/tenant-1 → { id: 'tenant-1', firstName: 'Maria', lastName: 'Santos', ... }
```

Add CRUD handlers (method-aware):
- `POST /admin/spaces` → 201 with new space object
- `PATCH /admin/spaces/:id` → 200 with updated space
- `DELETE /admin/spaces/:id` → 204
- `POST /admin/tenants` → 201 with new tenant
- `PATCH /admin/tenants/:id` → 200 with updated tenant

---

## E2E Test Strategy

### Local dev (default): mock server on port 3099
- `npm run dev` in web server with `INTERNAL_API_URL=http://localhost:3099`
- Mock server handles all requests

### Docker (integration): real backend
```bash
docker-compose up -d
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test
```
- No mock server — uses real NestJS + PostgreSQL
- Tests must create their own data (via direct API calls in `test.beforeEach`)
- Global setup seeds a default admin user via env vars

### Test files

**`admin-spaces-crud.spec.ts`** tests:
1. Spaces list renders correctly
2. "New Space" button opens create modal
3. Submit create form → space appears in list
4. Edit button opens pre-filled edit modal
5. Submit edit → updated name appears
6. Delete button shows confirmation → confirm → row removed

**`admin-tenants-crud.spec.ts`** tests:
1. Tenants list renders correctly with firstName + lastName
2. "New Tenant" button opens create modal
3. Submit create form → tenant appears in list
4. Edit button opens pre-filled form
5. Submit edit → updated name appears

---

## Implementation Order

1. Fix tenants data model (frontend interfaces)
2. Create Next.js API routes for spaces + tenants CRUD
3. Build `SpacesClient` component with create/edit/delete modal
4. Update `spaces/page.tsx` to use `SpacesClient`
5. Build `TenantsClient` component with create/edit modal
6. Update `tenants/page.tsx` to use `TenantsClient`
7. Implement `contracts/page.tsx` with real list
8. Add Contracts to nav
9. Update `global-setup.ts` with all missing fixtures + CRUD handlers
10. Write `admin-spaces-crud.spec.ts` and `admin-tenants-crud.spec.ts`
11. Run `docker-compose up -d` → run Playwright → fix any failures

---

## Verification

```bash
# Docker stack
docker-compose up --build -d

# Wait for healthy, then run E2E suite against Docker
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test --project=chromium

# Or run locally with mock server (faster iteration)
cd apps/web && npx playwright test
```

Expected: all tests pass (spaces CRUD, tenants CRUD, dashboard, login, contracts).
