# Phase 4 — Runtime Settings & Configuration

## Context
Phase 4 implements the key-value runtime settings model defined in the v1 spec (section 4). The `settings` table, seed data (`tenant.hide_expired = true`), and module scaffolding already exist but the service is empty. This phase wires the cache, exposes helpers, and integrates the `tenant.hide_expired` flag into tenant visibility logic.

---

## Branch
`feat/phase-04-runtime-settings`

---

## What Already Exists (do not re-create)
- `settings` table in `apps/api/src/database/schema.ts`
- `seedDefaultSettings()` in `apps/api/src/database/seed.ts` — seeds `tenant.hide_expired = true` idempotently
- `SettingsModule` / `SettingsService` / `SettingsController` stubs in `apps/api/src/settings/`
- `SettingsModule` already imported in `AppModule`
- `settings.module.spec.ts` — compile check test

---

## Implementation Plan

### ✅ Step 1 — Write failing tests for SettingsService (TDD)
**File:** `apps/api/src/settings/settings.service.spec.ts` (new)

Tests to write:
- loads all settings rows into in-memory cache on `onApplicationBootstrap()`
- `get(key)` returns the value for a known key
- `get(key)` returns `undefined` for unknown key
- `getBoolean('tenant.hide_expired')` returns `true` when value is `'true'`
- `getBoolean('missing.key', false)` returns default value when key absent
- DB-backed test (`hasDatabaseUrl ? it : it.skip`): settings are populated after bootstrap

Mock DB pattern (unit tests):
```typescript
const mockDb = {
    select: jest.fn().mockReturnValue({
        from: jest.fn().mockResolvedValue([{ key: 'tenant.hide_expired', value: 'true' }])
    })
};
```

### ✅ Step 2 — Implement SettingsService
**File:** `apps/api/src/settings/settings.service.ts`

```typescript
@Injectable()
export class SettingsService implements OnApplicationBootstrap {
    private cache = new Map<string, string>();

    constructor(@Inject(DB_TOKEN) private readonly db: any) {}

    async onApplicationBootstrap(): Promise<void> {
        await this.loadSettings();
    }

    async loadSettings(): Promise<void> {
        const rows = await this.db.select().from(settings);
        this.cache.clear();
        for (const row of rows) this.cache.set(row.key, row.value);
    }

    get(key: string): string | undefined {
        return this.cache.get(key);
    }

    getBoolean(key: string, defaultValue = false): boolean {
        const val = this.cache.get(key);
        if (val === undefined) return defaultValue;
        return val === 'true';
    }
}
```

**File:** `apps/api/src/settings/settings.module.ts` — add `exports: [SettingsService]`

### ✅ Step 3 — Write failing tests for TenantsService
**File:** `apps/api/src/tenants/tenants.service.spec.ts` (new)

Tests to write:
- `findAll()` returns all tenants when `tenant.hide_expired = false`
- `findAll()` filters out tenants where `expiration_date < today` when `tenant.hide_expired = true`
- `findAll()` includes tenants with `expiration_date = null` even when hide_expired is true
- DB-backed tests (`hasDatabaseUrl ? it : it.skip`):
  - insert inactive tenant with past expiration → hidden when setting is true
  - insert inactive tenant with future expiration → visible when setting is true

### ✅ Step 4 — Implement TenantsService
**File:** `apps/api/src/tenants/tenants.service.ts`

```typescript
@Injectable()
export class TenantsService {
    constructor(
        @Inject(DB_TOKEN) private readonly db: any,
        private readonly settingsService: SettingsService,
    ) {}

    async findAll(): Promise<typeof tenants.$inferSelect[]> {
        const hideExpired = this.settingsService.getBoolean('tenant.hide_expired');
        const query = this.db.select().from(tenants);
        if (hideExpired) {
            return query.where(
                or(isNull(tenants.expirationDate), gt(tenants.expirationDate, sql`CURRENT_DATE`))
            );
        }
        return query;
    }
}
```

**File:** `apps/api/src/tenants/tenants.module.ts` — add `imports: [AuthModule, SettingsModule]`

### ✅ Step 5 — Update settings.module.spec.ts
Extend existing compile test to verify `SettingsService` is exported and injectable:
- verify `SettingsService` can be retrieved from the compiled module

---

## Files Modified
| File | Action |
|------|--------|
| `apps/api/src/settings/settings.service.ts` | Implement cache + helpers |
| `apps/api/src/settings/settings.module.ts` | Add `exports: [SettingsService]` |
| `apps/api/src/settings/settings.service.spec.ts` | New — unit + DB-backed tests |
| `apps/api/src/tenants/tenants.service.ts` | Implement `findAll()` with hide_expired |
| `apps/api/src/tenants/tenants.module.ts` | Add `SettingsModule` to imports |
| `apps/api/src/tenants/tenants.service.spec.ts` | New — unit + DB-backed tests |
| `apps/api/src/settings/settings.module.spec.ts` | Extend with export verification |

**No new migrations or schema changes needed** — `settings` table and seed are already in place.

---

## Drizzle Imports Needed (for TenantsService)
- `or`, `isNull`, `gt`, `sql` from `drizzle-orm`
- `tenants` from `../database/schema`

---

## Verification
1. `npm test` — all tests pass (DB tests self-skip in CI)
2. With `DATABASE_URL` set locally:
   - `npm run db:seed --workspace=apps/api` — verify `tenant.hide_expired` row is present
   - Run DB-backed tests: tenant filtering works as expected
3. Confirm `SettingsService` is available as a dependency in TenantsModule without circular dependencies
