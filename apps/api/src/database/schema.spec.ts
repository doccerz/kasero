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

describe('DB invariant — contract immutability trigger', () => {
    let pool: Pool;
    let tenantId: string;
    let spaceId: string;
    let contractId: string;

    beforeAll(async () => {
        if (!hasDatabaseUrl) return;
        pool = new Pool({ connectionString: process.env.DATABASE_URL });

        // Insert prerequisite tenant and space
        const tenant = await pool.query(
            `INSERT INTO tenants (first_name, last_name) VALUES ('Test', 'Tenant') RETURNING id`,
        );
        tenantId = tenant.rows[0].id;

        const space = await pool.query(
            `INSERT INTO spaces (name) VALUES ('Test Space Immut') RETURNING id`,
        );
        spaceId = space.rows[0].id;

        // Insert a posted contract
        const contract = await pool.query(
            `INSERT INTO contracts (tenant_id, space_id, start_date, end_date, rent_amount, billing_frequency, due_date_rule, status)
             VALUES ($1, $2, '2024-01-01', '2024-12-31', 5000.00, 'monthly', 1, 'posted') RETURNING id`,
            [tenantId, spaceId],
        );
        contractId = contract.rows[0].id;
    });

    afterAll(async () => {
        if (!pool) return;
        if (contractId) await pool.query(`DELETE FROM contracts WHERE id = $1`, [contractId]);
        if (spaceId) await pool.query(`DELETE FROM spaces WHERE id = $1`, [spaceId]);
        if (tenantId) await pool.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
        await pool.end();
    });

    const protectedFields: Array<[string, string]> = [
        ['start_date', "'2025-01-01'"],
        ['end_date', "'2025-12-31'"],
        ['rent_amount', '9999.00'],
        ['billing_frequency', "'quarterly'"],
        ['due_date_rule', '15'],
    ];

    for (const [field, value] of protectedFields) {
        (hasDatabaseUrl ? it : it.skip)(`blocks UPDATE of "${field}" on a posted contract`, async () => {
            await expect(
                pool.query(`UPDATE contracts SET ${field} = ${value} WHERE id = $1`, [contractId]),
            ).rejects.toThrow();
        });
    }

    (hasDatabaseUrl ? it : it.skip)('allows UPDATE of non-protected field (metadata) on a posted contract', async () => {
        await expect(
            pool.query(`UPDATE contracts SET metadata = '{"note":"ok"}' WHERE id = $1`, [contractId]),
        ).resolves.toBeDefined();
    });
});
