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

## Playwright E2E Testing
- `page.route()` only intercepts **browser-side** fetches. Server-side `fetch()` calls (in server components/pages) are Node.js and NOT interceptable by `page.route()`
- For server-side fetch mocking: start a mock HTTP server in `globalSetup.ts` and pass its URL via `INTERNAL_API_URL` in the `webServer.env` of `playwright.config.ts`
- For client-side fetch mocking (e.g. form submissions): use `page.route('**/path/**', ...)` normally
- Stale `.next/` cache causes false `tsc` errors after moving pages — `rm -rf .next` before type-checking after route restructuring

## Verification
- Run `npx tsc --noEmit` in `apps/web` to type-check without building
- Run `npx playwright test` in `apps/web` to run E2E tests (requires `npm run dev` or will auto-start)
<!-- END:nextjs-agent-rules -->
