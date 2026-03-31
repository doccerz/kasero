# Description

Error found during docker build

```
 > [web web-builder 6/6] RUN npm run build:
0.628 > next build
0.628
1.086 ⚠ Invalid next.config.ts options detected:
1.086 ⚠     Unrecognized key(s) in object: 'outputFileTracingRoot' at "experimental"
1.086 ⚠ See more info here: https://nextjs.org/docs/messages/invalid-next-config
1.088 ⚠ `experimental.outputFileTracingRoot` has been moved to `outputFileTracingRoot`. Please update your next.config.ts file accordingly.
1.113 ▲ Next.js 16.2.1 (Turbopack)
1.113 - Experiments (use with caution):
1.113   ? outputFileTracingRoot (invalid experimental key)

3.835   Running TypeScript ...
6.602 Failed to type check.
6.602
6.603 ./app/admin/dashboard/page.tsx:70:43
6.603 Type error: Type 'string' has no properties in common with type 'Properties<string | number, string & {}>'.
6.603
6.603   68 |                                 </td>
6.603   69 |                                 <td style={{ padding: '0.75rem 1rem' }}>
6.603 > 70 |                                     <span style={STATUS_STYLES[entry.occupancyStatus]}>
6.603      |                                           ^
6.603   71 |                                         {STATUS_LABELS[entry.occupancyStatus]}
6.603   72 |                                     </span>
6.603   73 |                                 </td>
6.675 Next.js build worker exited with code: 1 and signal: null
6.720 npm error Lifecycle script `build` failed with error:
6.720 npm error code 1
6.720 npm error path /app/apps/web
6.720 npm error workspace kasero-web@0.1.0
6.720 npm error location /app/apps/web
6.720 npm error command failed
6.720 npm error command sh -c next build
------
Dockerfile:21
```

# How to replicate

Run command

```
docker compose up -d build
```

Error will show in the logs