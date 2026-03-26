import { seedDefaultSettings, seedAdminUser, seedAppVersion } from './seed';

const hasDatabaseUrl = !!process.env.DATABASE_URL;

describe('seed functions', () => {
    (hasDatabaseUrl ? it : it.skip)('seedDefaultSettings is idempotent', async () => {
        await expect(seedDefaultSettings()).resolves.not.toThrow();
        await expect(seedDefaultSettings()).resolves.not.toThrow();
    });

    (hasDatabaseUrl ? it : it.skip)('seedAdminUser is idempotent', async () => {
        await expect(seedAdminUser('test_admin', 'test_password_123')).resolves.not.toThrow();
        await expect(seedAdminUser('test_admin', 'test_password_123')).resolves.not.toThrow();
    });

    (hasDatabaseUrl ? it : it.skip)('seedAppVersion is idempotent', async () => {
        await expect(seedAppVersion('0.0.0-test')).resolves.not.toThrow();
        await expect(seedAppVersion('0.0.0-test')).resolves.not.toThrow();
    });

    it('seed module exports the expected functions', () => {
        expect(typeof seedDefaultSettings).toBe('function');
        expect(typeof seedAdminUser).toBe('function');
        expect(typeof seedAppVersion).toBe('function');
    });
});
