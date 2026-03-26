# Phase 1 — Foundation & Project Setup

## Context
Greenfield phase. The monorepo root exists with CI/CD workflows, a placeholder Dockerfile, and an empty `apps/` directory. No application code has been written. Phase 1 establishes the full structural foundation — NestJS backend, Next.js frontend, Drizzle schema, and DB seeding — so all subsequent phases can build on it.

## Branch
`feat/phase-01-foundation`

---

## TDD Commit Sequence

Follow strictly: write failing tests → commit (RED) → implement → commit → verify pass → commit (GREEN).

---

### Group 1 — NestJS API Skeleton

- [x] **RED** `test(api): add failing health check tests before NestJS scaffold`
  - Create `apps/api/src/app.controller.spec.ts` and `app.module.spec.ts` (import non-existent modules → fails)

- [x] **GREEN** `feat(api): scaffold NestJS application skeleton`
  - Run `npx @nestjs/cli new api --package-manager npm --skip-git --strict` inside `apps/`
  - Set `"name": "kasero-api"` in `apps/api/package.json`
  - Update `apps/api/src/main.ts`: `await app.listen(process.env.API_PORT ?? 3001)`

- [x] **VERIFY** `test(api): verify NestJS scaffold tests pass`

---

### Group 2 — Next.js Web Skeleton

- [x] **RED** `test(web): add failing root layout smoke test before Next.js scaffold`
  - Create `apps/web/__tests__/app.test.tsx` importing non-existent `app/layout`

- [x] **GREEN** `feat(web): scaffold Next.js application skeleton`
  - Run `npx create-next-app web --typescript --app --eslint --tailwind --no-turbopack --import-alias "@/*" --skip-install` inside `apps/`
  - Set `"name": "kasero-web"` in `apps/web/package.json`
  - Add Jest deps: `@testing-library/jest-dom`, `@testing-library/react`, `jest`, `jest-environment-jsdom`, `ts-jest`
  - Create `apps/web/jest.config.ts` using `next/jest` preset

- [x] **VERIFY** `test(web): verify Next.js scaffold smoke test passes`

---

### Group 3 — Root Workspace Scripts

- [x] **GREEN** `chore(root): wire workspace scripts and test delegation`
  - Update root `package.json` scripts:
    ```json
    "dev": "npm run dev --workspace=apps/api & npm run dev --workspace=apps/web",
    "dev:api": "npm run start:dev --workspace=apps/api",
    "dev:web": "npm run dev --workspace=apps/web",
    "test": "npm run test --workspace=apps/api --if-present && npm run test --workspace=apps/web --if-present",
    "test:api": "npm run test --workspace=apps/api",
    "test:web": "npm run test --workspace=apps/web",
    "test:api:db": "npm run test:db --workspace=apps/api",
    "db:generate": "npm run db:generate --workspace=apps/api",
    "db:migrate": "npm run db:migrate --workspace=apps/api",
    "db:seed": "npm run db:seed --workspace=apps/api"
    ```

---

### Group 4 — NestJS Module Scaffolding

- [x] **RED** `test(api): add failing module compilation tests for all 8 modules`
  - Create `apps/api/src/<module>/<module>.module.spec.ts` for each: `auth`, `settings`, `spaces`, `tenants`, `contracts`, `ledgers`, `public-access`, `audit`
  - Each spec: `Test.createTestingModule({ imports: [Module] }).compile()` → fails (modules don't exist)

- [x] **GREEN** `feat(api): scaffold all 8 NestJS modules`
  - From `apps/api/`, for each module:
    ```
    npx nest generate module <name>
    npx nest generate service <name> --no-spec
    npx nest generate controller <name> --no-spec
    ```
  - Update `apps/api/src/app.module.ts` to import all 8

- [x] **VERIFY** `test(api): verify all module compilation tests pass`

---

### Group 5 — Drizzle ORM Setup

- [x] **RED** `test(api): add failing DB connection and schema export tests`
  - Create `apps/api/src/database/database.spec.ts` — exports test always runs; connection test self-skips without `DATABASE_URL`
  - Create `apps/api/src/database/schema.spec.ts` — imports all 11 tables (fails, schema doesn't exist)

- [x] **GREEN** `feat(api): add Drizzle schema, database module, migration config`

  **Install:** `drizzle-orm`, `pg`, `drizzle-kit` (dev), `@types/pg` (dev)

  **`apps/api/src/database/schema.ts`** — 11 tables + 5 enums:

  | Table | Key columns |
  |-------|------------|
  | `spaces` | id, name, description, metadata(jsonb), deleted_at, created_at, updated_at |
  | `tenants` | id, first_name, last_name, contact_info(jsonb), status(enum), expiration_date(date), metadata, created_at, updated_at |
  | `contracts` | id, tenant_id, space_id, start_date(date), end_date(date), rent_amount(numeric 12,2), billing_frequency(enum), due_date_rule(int), deposit_amount(numeric), advance_months(int), status(enum), metadata, created_at, updated_at |
  | `payables` | id, contract_id, period_start(date), period_end(date), amount(numeric), due_date(date), created_at |
  | `payments` | id, contract_id, amount(numeric), date(date), voided_at, created_at |
  | `fund` | id, contract_id, type(enum: deposit/excess), amount(numeric), created_at |
  | `settings` | id, key(text unique), value(text), updated_at |
  | `app_version` | id, version, initialized_at |
  | `admin_users` | id, username(text unique), password_hash, created_at |
  | `public_access_codes` | id, contract_id, code(uuid unique defaultRandom()), revoked_at, created_at |
  | `audit` | id, entity_type, entity_id, action(enum), metadata(jsonb), created_at |

  **Schema design decisions:**
  - `numeric(12,2)` for all money — never `float`
  - `date` for business dates; `timestamp` for system timestamps
  - `jsonb` for metadata/contact_info
  - `uuid().defaultRandom()` for `public_access_codes.code` (non-guessable, unique, revocable)
  - `pgEnum` enforces valid values at DB layer
  - One-active-contract constraint = partial unique index in migration SQL

  **`apps/api/src/database/database.ts`:**
  ```typescript
  export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  export const db = drizzle(pool, { schema });
  ```

  **`apps/api/src/database/database.module.ts`:** `@Global()` module, exports `DB_TOKEN = 'DRIZZLE_DB'`, calls `pool.end()` on shutdown

  **`apps/api/drizzle.config.ts`:** schema path, migrations out to `./drizzle/migrations`, dialect `postgresql`

  **`apps/api/package.json` scripts:**
  ```json
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio",
  "db:seed": "ts-node -r tsconfig-paths/register src/database/seed.ts"
  ```

  **`apps/api/drizzle/migrations/`** — create dir with `.gitkeep`

  **Manual migration additions** (`0001_constraints_and_triggers.sql`):
  ```sql
  -- One active contract per space
  CREATE UNIQUE INDEX uq_space_one_active_contract ON contracts(space_id) WHERE status = 'posted';

  -- Tenant expiration trigger
  CREATE OR REPLACE FUNCTION set_tenant_expiration() RETURNS TRIGGER AS $$
  BEGIN
      IF NEW.status = 'inactive' AND (OLD.status IS DISTINCT FROM 'inactive') THEN
          NEW.expiration_date := CURRENT_DATE + INTERVAL '10 years';
      ELSIF NEW.status = 'active' THEN
          NEW.expiration_date := NULL;
      END IF;
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER trg_tenant_expiration
  BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION set_tenant_expiration();
  ```

- [x] **VERIFY** `test(api): verify schema export tests pass, DB connection test self-skips`

---

### Group 6 — Config Module

- [x] **RED** `test(api): add failing config module tests`
  - `apps/api/src/config/config.spec.ts` — tests `appConfig.apiPort` reads from env

- [x] **GREEN** `feat(api): add flat config module`
  - `apps/api/src/config/config.ts` — flat object, no `@nestjs/config`, no class:
    ```typescript
    export const appConfig = {
        apiPort: parseInt(process.env.API_PORT ?? '3001', 10),
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
        databaseUrl: process.env.DATABASE_URL,
        adminUsername: process.env.ADMIN_USERNAME ?? 'admin',
        adminPassword: process.env.ADMIN_PASSWORD,
        nodeEnv: process.env.NODE_ENV ?? 'development',
    };
    ```
  - Update `main.ts` to use `appConfig.apiPort`

---

### Group 7 — Next.js Route Structure

- [x] **RED** `test(web): add failing route layout tests for admin, public, and entry sections`
  - `apps/web/__tests__/admin-layout.test.tsx`, `public-layout.test.tsx`, `entry-layout.test.tsx`
  - Mock `next/navigation` and `next/headers` to isolate server components

- [x] **GREEN** `feat(web): scaffold full App Router directory structure`

  Create stub pages/layouts (each returns a minimal `<main>` element):
  ```
  app/
  ├── page.tsx                       (root: code entry for tenant status)
  ├── admin/
  │   ├── layout.tsx                 (auth guard: check cookie, redirect to /admin/login if absent)
  │   ├── login/page.tsx
  │   ├── dashboard/page.tsx
  │   ├── spaces/page.tsx + [id]/page.tsx
  │   ├── tenants/page.tsx + [id]/page.tsx
  │   └── contracts/page.tsx + [id]/page.tsx
  ├── public/
  │   ├── layout.tsx
  │   └── [code]/page.tsx
  └── entry/
      ├── layout.tsx
      └── [token]/page.tsx
  ```

- [x] **VERIFY** `test(web): verify all web route layout tests pass`

---

### Group 8 — Seed and Startup Migration

- [ ] **RED** `test(api): add failing seed function tests`
  - `apps/api/src/database/seed.spec.ts` — self-skips without `DATABASE_URL`; tests idempotency of `seedDefaultSettings` and `seedAdminUser`

- [ ] **GREEN** `feat(api): add idempotent seed functions and startup migration runner`

  **Install:** `bcryptjs`, `@types/bcryptjs` (pure-JS, avoids native binding issues in Alpine)

  **`apps/api/src/database/seed.ts`:**
  - `seedDefaultSettings()` — inserts `tenant.hide_expired=true` via `onConflictDoNothing()`
  - `seedAdminUser(username, password)` — bcryptjs hash + insert if not exists
  - `seedAppVersion(version)` — inserts if not exists
  - Entry point when `require.main === module`

  **`apps/api/src/database/migrate.ts`:**
  ```typescript
  export async function runMigrations() {
      const migrationsFolder = process.env.MIGRATIONS_PATH
          ?? path.join(__dirname, '../../drizzle/migrations');
      await migrate(db, { migrationsFolder });
  }
  ```

  **Update `apps/api/src/main.ts`:**
  ```typescript
  if (process.env.DATABASE_URL) {
      await runMigrations();
      await seedDefaultSettings();
      await seedAdminUser(appConfig.adminUsername, appConfig.adminPassword!);
  }
  ```

---

### Group 9 — Dockerfile and Final Integration

- [ ] **GREEN** `chore(docker): implement multi-stage Dockerfile for NestJS API`
  ```dockerfile
  FROM node:24-alpine AS deps
  RUN apk add --no-cache python3 make g++
  WORKDIR /app
  COPY package.json apps/api/package.json apps/web/package.json ./
  RUN npm install --no-package-lock

  FROM node:24-alpine AS builder
  WORKDIR /app
  COPY --from=deps /app/node_modules ./node_modules
  COPY . .
  WORKDIR /app/apps/api
  RUN npm run build

  FROM node:24-alpine AS runner
  WORKDIR /app
  ENV NODE_ENV=production
  ENV TZ=Asia/Manila
  COPY --from=builder /app/apps/api/dist ./dist
  COPY --from=builder /app/apps/api/drizzle ./drizzle
  COPY --from=deps /app/node_modules ./node_modules
  EXPOSE 3001
  CMD ["node", "dist/main.js"]
  ```

- [ ] **FINAL** `chore(phase-1): integration verification — all tests pass, docker build succeeds`
  - `npm install --no-package-lock` from root
  - `npm test` — all pass or self-skip
  - `docker build -t kasero .` — succeeds

---

## DB Test Self-Skip Pattern

All database-dependent tests use this idiomatic Jest pattern:
```typescript
const hasDatabaseUrl = !!process.env.DATABASE_URL;
(hasDatabaseUrl ? it : it.skip)('description', async () => { /* ... */ });
// or for suites:
(hasDatabaseUrl ? describe : describe.skip)('DB suite', () => { ... });
```
- CI runs `npm test` without `DATABASE_URL` → DB tests skip → exit code 0 ✓
- Local run with `DATABASE_URL` → DB tests execute → real DB validation ✓

---

## Critical Files

| File | Purpose |
|------|---------|
| `package.json` (root) | Workspace scripts |
| `Dockerfile` | Multi-stage production build |
| `apps/api/src/database/schema.ts` | All 11 table definitions + enums |
| `apps/api/src/database/database.module.ts` | Global NestJS DB provider |
| `apps/api/src/database/seed.ts` | Idempotent seeding |
| `apps/api/drizzle/migrations/` | Migration SQL files |
| `apps/web/app/admin/layout.tsx` | Auth guard (redirect if no cookie) |

---

## Exit Criteria

- [ ] `npm install --no-package-lock` from root — succeeds
- [ ] `npm test` from root — all tests pass/skip, exit 0
- [ ] `docker build -t kasero .` — succeeds
- [ ] With `DATABASE_URL`: `npm run db:migrate --workspace=apps/api` runs migrations
- [ ] With `DATABASE_URL`: `npm run db:seed --workspace=apps/api` seeds admin + settings
- [ ] `npm run dev:api` starts NestJS on port 3001
- [ ] Module structure ready for Phase 2 feature implementation
