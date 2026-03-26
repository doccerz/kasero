import { Pool } from 'pg';
import {
    spaces,
    tenants,
    contracts,
    payables,
    payments,
    fund,
    settings,
    appVersion,
    adminUsers,
    publicAccessCodes,
    audit,
} from './schema';

const hasDatabaseUrl = !!process.env.DATABASE_URL;

describe('Schema exports', () => {
    it('should export spaces table', () => {
        expect(spaces).toBeDefined();
    });

    it('should export tenants table', () => {
        expect(tenants).toBeDefined();
    });

    it('should export contracts table', () => {
        expect(contracts).toBeDefined();
    });

    it('should export payables table', () => {
        expect(payables).toBeDefined();
    });

    it('should export payments table', () => {
        expect(payments).toBeDefined();
    });

    it('should export fund table', () => {
        expect(fund).toBeDefined();
    });

    it('should export settings table', () => {
        expect(settings).toBeDefined();
    });

    it('should export appVersion table', () => {
        expect(appVersion).toBeDefined();
    });

    it('should export adminUsers table', () => {
        expect(adminUsers).toBeDefined();
    });

    it('should export publicAccessCodes table', () => {
        expect(publicAccessCodes).toBeDefined();
    });

    it('should export audit table', () => {
        expect(audit).toBeDefined();
    });
});

describe('DB migration — all tables exist', () => {
    let pool: Pool;

    beforeAll(() => {
        if (!hasDatabaseUrl) return;
        pool = new Pool({ connectionString: process.env.DATABASE_URL });
    });

    afterAll(async () => {
        if (pool) await pool.end();
    });

    const expectedTables = [
        'spaces',
        'tenants',
        'contracts',
        'payables',
        'payments',
        'fund',
        'settings',
        'app_version',
        'admin_users',
        'public_access_codes',
        'audit',
    ];

    for (const tableName of expectedTables) {
        (hasDatabaseUrl ? it : it.skip)(`table "${tableName}" exists after migration`, async () => {
            const result = await pool.query(
                `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
                [tableName],
            );
            expect(result.rows).toHaveLength(1);
        });
    }

    (hasDatabaseUrl ? it : it.skip)('all 5 enums exist after migration', async () => {
        const result = await pool.query(
            `SELECT typname FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')`,
        );
        const enumNames = result.rows.map((r: { typname: string }) => r.typname).sort();
        expect(enumNames).toEqual(
            ['audit_action', 'billing_frequency', 'contract_status', 'fund_type', 'tenant_status'].sort(),
        );
    });
});
