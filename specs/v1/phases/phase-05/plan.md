# Phase 5 — Core Master Data: Spaces & Tenants

## Context

Phase 4 delivered the runtime settings infrastructure (`tenant.hide_expired`). Phase 5 builds full CRUD for both spaces and tenants, completing the core master data layer needed before contracts can be built in Phase 6.

Both module skeletons already exist with guards in place. The `TenantsService.findAll()` with `hide_expired` filtering is already implemented and tested. Everything else needs to be built TDD-first.

---

## Branch

```
feat/phase-05-spaces-tenants
```
Create from `feat/phase-04-runtime-settings` before starting.

---

## Critical Files

| File | Status |
|------|--------|
| `apps/api/src/spaces/spaces.service.ts` | Empty stub — full impl needed |
| `apps/api/src/spaces/spaces.controller.ts` | Empty stub — 5 routes needed |
| `apps/api/src/spaces/spaces.controller.spec.ts` | Guard tests exist — add endpoint tests |
| `apps/api/src/tenants/tenants.service.ts` | `findAll()` done — add 3 methods |
| `apps/api/src/tenants/tenants.service.spec.ts` | `findAll` tests done — add 3 describe blocks |
| `apps/api/src/tenants/tenants.controller.ts` | Empty stub — 4 routes needed |
| `apps/api/src/database/schema.ts` | Reference for table types |

**New files to create:**
- `apps/api/src/spaces/spaces.service.spec.ts`
- `apps/api/src/tenants/tenants.controller.spec.ts`

---

## Implementation Plan (strict TDD order)

### Group 1 — Spaces service tests (failing) ✅ COMPLETE
Create `apps/api/src/spaces/spaces.service.spec.ts`:

**Unit tests** (mocked `DB_TOKEN`):
- `findAll` returns only non-deleted spaces (filters `deletedAt IS NULL`)
- `findAll` returns empty array when all spaces are deleted
- `findOne(id)` returns space by id when not deleted
- `findOne(id)` throws `NotFoundException` when no row found
- `findOne(id)` throws `NotFoundException` when space is soft-deleted
- `create(data)` inserts and returns the created row
- `update(id, data)` updates partial data and returns updated row
- `update(id, data)` throws `NotFoundException` when no rows returned
- `remove(id)` sets `deletedAt = now()` and returns the soft-deleted row
- `remove(id)` throws `NotFoundException` when no rows returned

**DB integration tests** (skip if no `DATABASE_URL`):
- Insert space, `findAll` returns it; `remove` it, `findAll` no longer returns it

**Mock DB builder** (reuse across tests):
```typescript
function buildMockDb({ selectRows = [], mutationRows = [] } = {}) {
    const returning = jest.fn().mockResolvedValue(mutationRows);
    const whereForMutation = jest.fn().mockReturnValue({ returning });
    const set = jest.fn().mockReturnValue({ where: whereForMutation });
    const values = jest.fn().mockReturnValue({ returning });
    const whereForSelect = jest.fn().mockResolvedValue(selectRows);
    const from = jest.fn().mockReturnValue({ where: whereForSelect });
    return {
        select: jest.fn().mockReturnValue({ from }),
        insert: jest.fn().mockReturnValue({ values }),
        update: jest.fn().mockReturnValue({ set }),
        _from: from, _whereForSelect: whereForSelect, _returning: returning,
    };
}
```

### Group 2 — Implement `spaces.service.ts` ✅ COMPLETE

Inject `@Inject(DB_TOKEN) private readonly db: any`.

```typescript
async findAll(): Promise<typeof spaces.$inferSelect[]> {
    return this.db.select().from(spaces).where(isNull(spaces.deletedAt));
}

async findOne(id: string): Promise<typeof spaces.$inferSelect> {
    const rows = await this.db.select().from(spaces)
        .where(and(eq(spaces.id, id), isNull(spaces.deletedAt)));
    if (!rows[0]) throw new NotFoundException('Space not found');
    return rows[0];
}

async create(data: { name: string; description?: string; metadata?: unknown }) {
    const rows = await this.db.insert(spaces).values(data).returning();
    return rows[0];
}

async update(id: string, data: Partial<{ name: string; description: string; metadata: unknown }>) {
    const rows = await this.db.update(spaces)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(spaces.id, id), isNull(spaces.deletedAt)))
        .returning();
    if (!rows[0]) throw new NotFoundException('Space not found');
    return rows[0];
}

async remove(id: string) {
    const rows = await this.db.update(spaces)
        .set({ deletedAt: new Date() })
        .where(and(eq(spaces.id, id), isNull(spaces.deletedAt)))
        .returning();
    if (!rows[0]) throw new NotFoundException('Space not found');
    return rows[0];
}
```

Key: `isNull` guard in `update`/`remove` ensures already-deleted spaces return 404, not a silent no-op. `updatedAt` must be set manually (Drizzle `defaultNow()` only applies on insert).

### Group 3 — Spaces controller endpoint tests ✅ COMPLETE

Add a second `describe('SpacesController — endpoints')` block to `spaces.controller.spec.ts`. Mock `SpacesService` entirely; override `JwtAuthGuard` with `{ canActivate: () => true }`.

Tests:
- `GET /admin/spaces` → 200 with `findAll()` result
- `GET /admin/spaces/:id` → 200 with `findOne()` result
- `GET /admin/spaces/:id` when `NotFoundException` → 404
- `POST /admin/spaces` → 201 with `create()` result
- `PATCH /admin/spaces/:id` → 200 with `update()` result
- `PATCH /admin/spaces/:id` when `NotFoundException` → 404
- `DELETE /admin/spaces/:id` → 200 with `remove()` result (soft-deleted record)
- `DELETE /admin/spaces/:id` when `NotFoundException` → 404

### Group 4 — Implement `spaces.controller.ts` ✅ COMPLETE

```typescript
@UseGuards(JwtAuthGuard)
@Controller('admin/spaces')
export class SpacesController {
    constructor(private readonly spacesService: SpacesService) {}

    @Get()          findAll() { return this.spacesService.findAll(); }
    @Get(':id')     findOne(@Param('id') id: string) { return this.spacesService.findOne(id); }
    @Post()         create(@Body() body) { return this.spacesService.create(body); }
    @Patch(':id')   update(@Param('id') id: string, @Body() body) { return this.spacesService.update(id, body); }
    @Delete(':id')  remove(@Param('id') id: string) { return this.spacesService.remove(id); }
}
```

POST returns 201 by NestJS default. DELETE returns 200 with the soft-deleted record (callers get confirmation).

### Group 5 — Tenant service additional tests ✅ COMPLETE

Extend `tenants.service.spec.ts` with three new `describe` blocks:

**`findOne`:**
- Returns tenant by id
- Throws `NotFoundException` when no rows returned

**`create`:**
- Inserts with `status: 'inactive'` and `expirationDate` = now+10y (service must set this — DB trigger only fires on `UPDATE`, not `INSERT`)
- Returns inserted row
- Throws `ConflictException` (409) with `{ duplicate: true, matchingIds: [...] }` when same firstName+lastName AND same contactInfo already exists
- Proceeds without conflict when name matches but contactInfo differs
- Handles `null` contactInfo matching: both null treated as equal

**`update`:**
- Calls update with partial payload + `updatedAt = new Date()`, returns row
- Throws `NotFoundException` when no rows returned
- When `status` in payload (e.g., to 'inactive'): service passes it through; DB trigger handles `expirationDate` on the `UPDATE`

### Group 6 — Implement new tenant service methods

```typescript
async findOne(id: string): Promise<typeof tenants.$inferSelect> {
    const rows = await this.db.select().from(tenants).where(eq(tenants.id, id));
    if (!rows[0]) throw new NotFoundException('Tenant not found');
    return rows[0];
}

async create(data: { firstName: string; lastName: string; contactInfo?: unknown; metadata?: unknown }) {
    // Duplicate detection
    const candidates = await this.db.select().from(tenants)
        .where(and(eq(tenants.firstName, data.firstName), eq(tenants.lastName, data.lastName)));
    const incoming = data.contactInfo ?? null;
    const matches = candidates.filter(t => jsonEqual(t.contactInfo, incoming));
    if (matches.length > 0) {
        throw new ConflictException({ duplicate: true, matchingIds: matches.map(t => t.id) });
    }

    // Default creation values — DB trigger doesn't fire on INSERT
    const expirationDate = toDateString(new Date(Date.now() + 10 * 365.25 * 24 * 60 * 60 * 1000));
    const rows = await this.db.insert(tenants)
        .values({ ...data, status: 'inactive', expirationDate })
        .returning();
    return rows[0];
}

async update(id: string, data: Partial<typeof tenants.$inferInsert>) {
    const rows = await this.db.update(tenants)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(tenants.id, id))
        .returning();
    if (!rows[0]) throw new NotFoundException('Tenant not found');
    return rows[0];
}
```

**`jsonEqual` helper** (inline in service file, not a shared util):
```typescript
function sortKeys(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sortKeys);
    return Object.keys(obj as object).sort().reduce((acc, k) => {
        (acc as any)[k] = sortKeys((obj as any)[k]);
        return acc;
    }, {} as object);
}
function jsonEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));
}
```

**`toDateString` helper** (inline): `(d: Date) => d.toISOString().split('T')[0]`

### Group 7 — Tenants controller tests

Create `apps/api/src/tenants/tenants.controller.spec.ts` with two describe blocks:

**Guard integration** (uses inline `@Controller` + Supertest):
- `GET /admin/tenants` without token → 401
- `GET /admin/tenants` with valid token → not 401

**Endpoint behavior** (mocked service, guard bypassed):
- `GET /admin/tenants` → 200
- `GET /admin/tenants/:id` → 200
- `GET /admin/tenants/:id` when `NotFoundException` → 404
- `POST /admin/tenants` → 201
- `POST /admin/tenants` when `ConflictException` → 409 with `{ duplicate: true, matchingIds }`
- `PATCH /admin/tenants/:id` → 200
- `PATCH /admin/tenants/:id` when `NotFoundException` → 404
- `DELETE /admin/tenants/:id` → 404 (route does not exist)

### Group 8 — Implement `tenants.controller.ts`

```typescript
@UseGuards(JwtAuthGuard)
@Controller('admin/tenants')
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) {}

    @Get()         findAll() { return this.tenantsService.findAll(); }
    @Get(':id')    findOne(@Param('id') id: string) { return this.tenantsService.findOne(id); }
    @Post()        create(@Body() body) { return this.tenantsService.create(body); }
    @Patch(':id')  update(@Param('id') id: string, @Body() body) { return this.tenantsService.update(id, body); }
}
```

No `@Delete` route. `ConflictException` from the service propagates via NestJS's built-in exception filter — no special handling needed.

---

### Group 9 - Verification

```bash
# Run all tests
npm test --workspace=apps/api

# Run with real DB (local postgres container: name=postgres, user=admin, pw=admin, db=devdb)
DATABASE_URL=postgresql://admin:admin@localhost:5432/kasero_test npm test --workspace=apps/api

# Manual smoke test (API must be running)
# Login
curl -X POST http://localhost:3001/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"<pw>"}'
# Use returned token for:
curl http://localhost:3001/admin/spaces -H 'Authorization: Bearer <token>'
curl -X POST http://localhost:3001/admin/spaces -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"name":"Unit 1"}'
curl http://localhost:3001/admin/tenants -H 'Authorization: Bearer <token>'
curl -X POST http://localhost:3001/admin/tenants -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"firstName":"Alice","lastName":"Smith"}'
# Duplicate attempt (same name, no contactInfo) → 409
curl -X POST http://localhost:3001/admin/tenants -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"firstName":"Alice","lastName":"Smith"}'
```

---

#### Edge Cases

- `PATCH /admin/spaces/:id` with `{}` body: `updatedAt` is always set so Drizzle never gets an empty `.set({})`.
- `DELETE /admin/spaces/:id` when already soft-deleted: `isNull` guard in `where` matches zero rows → 404. Correct.
- Tenant `contactInfo` null matching: normalize `undefined` to `null` before `jsonEqual` to avoid `JSON.stringify(undefined)` returning `undefined` (not a string).
- `expirationDate` on tenant create: DB trigger fires only on `UPDATE`. Service must compute and insert it explicitly. Calculation: `now + 10 * 365.25 days` formatted as `YYYY-MM-DD`.
