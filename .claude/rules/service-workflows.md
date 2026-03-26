# Service Workflows

- Explore subagent file detection: always verify suspected-missing files with `ls <dir>` before assuming they don't exist — subagents have incorrectly reported existing files as missing
- `.gitignore` blocks `drizzle/` by default — was changed to `drizzle/meta/` so migration files in `apps/api/drizzle/migrations/` are tracked; if `git add` fails on drizzle files, check `.gitignore`
- Drizzle schema table constraints use array syntax: `(t) => [unique().on(t.col)]` — object form is deprecated and will error
- Install workspace-specific packages inside `apps/api/` or `apps/web/`, not the monorepo root
- DB self-skip pattern confirmed working: tests using `(hasDatabaseUrl ? it : it.skip)` produce exit code 0 in CI without `DATABASE_URL`; 1 skipped test does not fail the suite
- Config pattern: use a flat `appConfig` object (no `@nestjs/config`, no class) in `apps/api/src/config/config.ts`; import it wherever env values are needed (e.g., `main.ts`)
- Migration strategy: `schema.ts` → `npm run db:generate --workspace=apps/api` produces `0000_*.sql` (base tables); manual SQL migrations for constraints/triggers go in subsequent numbered files — do NOT hand-write the 0000 migration
- DB trigger pattern: PL/pgSQL function + paired `CREATE TRIGGER`; guard triggers `RAISE EXCEPTION` and return nothing; audit/mutation triggers return `NEW`
- Immutability trigger pattern: `BEFORE UPDATE` checks `OLD.status = 'posted'` → `RAISE EXCEPTION` if protected fields changed
- No-hard-delete trigger pattern: `BEFORE DELETE` raises `EXCEPTION`; one trigger per protected table; spaces excluded (soft-delete via `deleted_at`)
- Payment void audit trigger pattern: `AFTER UPDATE ON payments WHERE NEW.voided_at IS NOT NULL AND OLD.voided_at IS NULL` → INSERT into audit table
- Partial unique index pattern: `CREATE UNIQUE INDEX name ON table(col) WHERE condition` — used for one-active-contract-per-space
- Transaction-based test cleanup: when no-hard-delete triggers block DELETE in afterAll, use `pool.connect()` to get a dedicated client, run `BEGIN` in beforeAll, and `ROLLBACK` in afterAll — no DELETE needed; all inserts are undone by rollback
- SAVEPOINT pattern for blocked-operation tests: before each expected-to-fail DELETE, run `SAVEPOINT sp_name`; after the rejection, run `ROLLBACK TO SAVEPOINT sp_name` to recover the transaction for subsequent tests
- Apply manual SQL migrations via pipe to Docker: `cat migration.sql | docker exec -i <container> psql -U <user> -d <db>` — the `-f /dev/stdin` form does not work reliably
- Migration journal tracking: `drizzle-kit migrate` and the runtime `migrate()` both use `_journal.json` — manual SQL migration files must be added to the journal (idx, tag, when, breakpoints) or they won't run on fresh DBs
- Idempotent migration pattern: use `CREATE UNIQUE INDEX IF NOT EXISTS` for indexes; use `DROP TRIGGER IF EXISTS ... ON table` before `CREATE TRIGGER` to ensure re-runnable migrations; `CREATE OR REPLACE FUNCTION` is already idempotent
