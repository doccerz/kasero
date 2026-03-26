# Service Workflows

- Explore subagent file detection: always verify suspected-missing files with `ls <dir>` before assuming they don't exist — subagents have incorrectly reported existing files as missing
- `.gitignore` blocks `drizzle/` by default — was changed to `drizzle/meta/` so migration files in `apps/api/drizzle/migrations/` are tracked; if `git add` fails on drizzle files, check `.gitignore`
- Drizzle schema table constraints use array syntax: `(t) => [unique().on(t.col)]` — object form is deprecated and will error
- Install workspace-specific packages inside `apps/api/` or `apps/web/`, not the monorepo root
