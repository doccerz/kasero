<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Known breaking changes in this repo (Next.js 16.2.1)
- `params` in page components is a `Promise` — always `await params` before destructuring: `const { id } = await params`
- `cookies()` from `next/headers` is async — use `await cookies()`
- Server components that fetch data should be `async` functions; use `fetch(url, { cache: 'no-store' })` for dynamic data
- `INTERNAL_API_URL` env var is available server-side for NestJS API calls (defined in `.env.example`)
- Use `'use client'` directive for interactive forms/components; server components are the default
- `outputFileTracingRoot` is a top-level `next.config.ts` option, NOT under `experimental`
- React `style` prop requires `CSSProperties` objects (camelCase keys) — CSS strings are not valid
- **`middleware.ts` is DEPRECATED** — rename to `proxy.ts` and rename the export to `proxy()`: `export function proxy(request: NextRequest) {}`
- Route groups `(protected)` do NOT change URLs but the old pages at the same path must be deleted — Next.js throws "parallel pages that resolve to the same path" otherwise
- After restructuring routes, always `rm -rf .next` before `npx tsc --noEmit` to clear stale route type cache
- **Stale `.next/` cache causes UI and proxy regressions** — if pages show old unstyled content or `/admin/login` enters a redirect loop (`ERR_TOO_MANY_REDIRECTS`), run `rm -rf .next` in `apps/web` and restart `npm run dev`. The compiled middleware manifest must be regenerated from the current `proxy.ts`.
- **`proxy.ts` matcher must exclude paths that are redirect targets** — use a negative lookahead to exclude `/admin/login` from the matcher: `matcher: ['/admin/((?!login).+)']`. This prevents the proxy from running on the login page itself, eliminating any redirect loop if the matcher were ever broadened.

## Playwright E2E Testing
- `page.route()` only intercepts **browser-side** fetches. Server-side `fetch()` calls (in server components/pages) are Node.js and NOT interceptable by `page.route()`
- For server-side fetch mocking: start a mock HTTP server in `globalSetup.ts` and pass its URL via `INTERNAL_API_URL` in the `webServer.env` of `playwright.config.ts`
- For client-side fetch mocking (e.g. form submissions): use `page.route('**/path/**', ...)` normally
- Stale `.next/` cache causes false `tsc` errors after moving pages — `rm -rf .next` before type-checking after route restructuring
- **Strict mode in Playwright**: `getByText(/regex/)` fails when the regex matches multiple elements — use `getByRole('heading', { name: /regex/i })` or `.first()` to disambiguate; avoid broad regex selectors on pages with navbars that repeat the same text
- **SIT spec pattern**: save canonical spec in `specs/v1/qa/cycle-N/sit-<group>.spec.ts`, copy to `apps/web/e2e/sit-<group>.spec.ts`, and provide a `run-sit-<group>.js` runner in `apps/web/` that sets `PLAYWRIGHT_BASE_URL` and runs against the Docker stack
- **`getByRole('dialog')` requires `role="dialog"` on the modal element** — CSS-only overlays (e.g. `<div className="fixed inset-0 ...">`) are not semantically dialogs; add `role="dialog"` to the inner content div
- **`getByLabel()` requires associated labels** — use `htmlFor` on `<label>` paired with `id` on `<input>`; without this Playwright cannot locate form fields by label
- **SIT tests run against dev server by default** (`reuseExistingServer: true`) — running a Docker web container on port 3000 causes tests to hit the real API instead of the mock; stop the Docker web container before running `npx playwright test`
- **Mock server must handle all mutation endpoints** — add POST handlers for create/update/delete/void to `global-setup.ts`; missing handlers return 404 causing client-side error state and failed assertions

## Verification
- Run `npx tsc --noEmit` in `apps/web` to type-check without building
- Run `npx playwright test` in `apps/web` to run E2E tests (requires `npm run dev` or will auto-start)
<!-- END:nextjs-agent-rules -->
