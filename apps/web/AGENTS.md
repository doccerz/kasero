<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Known breaking changes in this repo (Next.js 16.2.1)
- `params` in page components is a `Promise` — always `await params` before destructuring: `const { id } = await params`
- `cookies()` from `next/headers` is async — use `await cookies()`
- Server components that fetch data should be `async` functions; use `fetch(url, { cache: 'no-store' })` for dynamic data
- `INTERNAL_API_URL` env var is available server-side for NestJS API calls (defined in `.env.example`)
- Use `'use client'` directive for interactive forms/components; server components are the default
<!-- END:nextjs-agent-rules -->
