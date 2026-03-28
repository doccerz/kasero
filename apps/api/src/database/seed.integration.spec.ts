import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { settings, adminUsers, appVersion } from './schema';
import { seedDefaultSettings, seedAdminUser, seedAppVersion } from './seed';

const hasDatabaseUrl = !!process.env.DATABASE_URL;

(hasDatabaseUrl ? describe : describe.skip)('seed functions — DB integration', () => {
    // Unique username per test run so we can verify and clean up
    const testAdminUsername = `test_seed_admin_${Date.now()}`;
    const testAdminPassword = 'test_seed_password_123!';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const db = hasDatabaseUrl ? require('./database').db : null;
    let pool: Pool;

    beforeAll(async () => {
        pool = new Pool({ connectionString: process.env.DATABASE_URL });
    });

    afterAll(async () => {
        // admin_users has no hard-delete trigger — safe to DELETE
        await pool.query('DELETE FROM admin_users WHERE username = $1', [testAdminUsername]);
        await pool.end();
    });

    describe('clean install: first run inserts without duplicates', () => {
        it('seedDefaultSettings inserts the settings key (or skips if already present)', async () => {
            const before = await db.select().from(settings).where(eq(settings.key, 'tenant.hide_expired'));
            await seedDefaultSettings();
            const after = await db.select().from(settings).where(eq(settings.key, 'tenant.hide_expired'));
            expect(after.length).toBeGreaterThanOrEqual(1);
            // At most 1 new row — onConflictDoNothing guarantees no duplicates
            expect(after.length).toBeLessThanOrEqual(before.length + 1);
        });

        it('seedAdminUser inserts exactly 1 row for the test username', async () => {
            const before = await db.select().from(adminUsers).where(eq(adminUsers.username, testAdminUsername));
            expect(before.length).toBe(0);

            await seedAdminUser(testAdminUsername, testAdminPassword);

            const after = await db.select().from(adminUsers).where(eq(adminUsers.username, testAdminUsername));
            expect(after.length).toBe(1);
        });

        it('seedAppVersion inserts a row when none exists or skips if already present', async () => {
            const before = await db.select().from(appVersion);
            await seedAppVersion('1.0.0');
            const after = await db.select().from(appVersion);
            expect(after.length).toBeGreaterThanOrEqual(1);
            // count-before-insert ensures no duplicates
            expect(after.length).toBeLessThanOrEqual(before.length + 1);
        });
    });

    describe('restart: re-running seed functions does not create duplicates', () => {
        it('running all seed functions a second time leaves row counts unchanged', async () => {
            // Count after first run
            const settingsBefore = await db.select().from(settings).where(eq(settings.key, 'tenant.hide_expired'));
            const adminBefore = await db.select().from(adminUsers).where(eq(adminUsers.username, testAdminUsername));
            const versionBefore = await db.select().from(appVersion);

            // Re-run all seed functions
            await seedDefaultSettings();
            await seedAdminUser(testAdminUsername, testAdminPassword);
            await seedAppVersion('1.0.0');

            // Assert row counts are unchanged
            const settingsAfter = await db.select().from(settings).where(eq(settings.key, 'tenant.hide_expired'));
            const adminAfter = await db.select().from(adminUsers).where(eq(adminUsers.username, testAdminUsername));
            const versionAfter = await db.select().from(appVersion);

            expect(settingsAfter.length).toBe(settingsBefore.length);
            expect(adminAfter.length).toBe(adminBefore.length);
            expect(versionAfter.length).toBe(versionBefore.length);
        });
    });
});
