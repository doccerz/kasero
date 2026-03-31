import type { Page } from '@playwright/test';

/**
 * Authenticates the page context.
 * - Mock mode (no PLAYWRIGHT_BASE_URL): injects the mock JWT cookie directly
 * - Docker/real mode: POSTs to the real login endpoint and receives a valid JWT cookie
 */
export async function setupAuth(page: Page) {
    if (process.env.PLAYWRIGHT_BASE_URL) {
        const username = process.env.ADMIN_USERNAME ?? 'admin';
        const password = process.env.ADMIN_PASSWORD ?? 'replace-with-a-strong-password';
        await page.request.post('/api/auth/login', {
            data: { username, password },
        });
    } else {
        await page.context().addCookies([
            { name: 'auth_token', value: 'eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiJ9.mock', domain: 'localhost', path: '/' },
        ]);
    }
}

/** True when running against a real backend (Docker). Useful for test.skip(). */
export const isDockerMode = !!process.env.PLAYWRIGHT_BASE_URL;
