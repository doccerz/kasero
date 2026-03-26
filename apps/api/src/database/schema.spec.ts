import { Pool, PoolClient } from 'pg';
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
    let client: PoolClient;
    let tenantId: string;
    let contractId: string;

    beforeAll(async () => {
        if (!hasDatabaseUrl) return;
        pool = new Pool({ connectionString: process.env.DATABASE_URL });
        client = await pool.connect();
        await client.query('BEGIN');

        const tenant = await client.query(
            `INSERT INTO tenants (first_name, last_name) VALUES ('Test', 'Tenant') RETURNING id`,
        );
        tenantId = tenant.rows[0].id;

        const space = await client.query(
            `INSERT INTO spaces (name) VALUES ('Test Space Immut') RETURNING id`,
        );
        const spaceId = space.rows[0].id;

        const contract = await client.query(
            `INSERT INTO contracts (tenant_id, space_id, start_date, end_date, rent_amount, billing_frequency, due_date_rule, status)
             VALUES ($1, $2, '2024-01-01', '2024-12-31', 5000.00, 'monthly', 1, 'posted') RETURNING id`,
            [tenantId, spaceId],
        );
        contractId = contract.rows[0].id;
    });

    afterAll(async () => {
        if (!client) return;
        await client.query('ROLLBACK');
        client.release();
        if (pool) await pool.end();
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
            await client.query('SAVEPOINT sp_immut');
            await expect(
                client.query(`UPDATE contracts SET ${field} = ${value} WHERE id = $1`, [contractId]),
            ).rejects.toThrow();
            await client.query('ROLLBACK TO SAVEPOINT sp_immut');
        });
    }

    (hasDatabaseUrl ? it : it.skip)('allows UPDATE of non-protected field (metadata) on a posted contract', async () => {
        await expect(
            client.query(`UPDATE contracts SET metadata = '{"note":"ok"}' WHERE id = $1`, [contractId]),
        ).resolves.toBeDefined();
    });
});

describe('DB invariant — payment void audit trigger', () => {
    let pool: Pool;
    let client: PoolClient;
    let contractId: string;
    let paymentId: string;

    beforeAll(async () => {
        if (!hasDatabaseUrl) return;
        pool = new Pool({ connectionString: process.env.DATABASE_URL });
        client = await pool.connect();
        await client.query('BEGIN');

        const tenant = await client.query(
            `INSERT INTO tenants (first_name, last_name) VALUES ('Void', 'AuditTest') RETURNING id`,
        );
        const tenantId = tenant.rows[0].id;

        const space = await client.query(
            `INSERT INTO spaces (name) VALUES ('Void Audit Space') RETURNING id`,
        );
        const spaceId = space.rows[0].id;

        const contract = await client.query(
            `INSERT INTO contracts (tenant_id, space_id, start_date, end_date, rent_amount, billing_frequency, due_date_rule, status)
             VALUES ($1, $2, '2024-01-01', '2024-12-31', 4000.00, 'monthly', 1, 'draft') RETURNING id`,
            [tenantId, spaceId],
        );
        contractId = contract.rows[0].id;

        const payment = await client.query(
            `INSERT INTO payments (contract_id, amount, date)
             VALUES ($1, 4000.00, '2024-01-10') RETURNING id`,
            [contractId],
        );
        paymentId = payment.rows[0].id;
    });

    afterAll(async () => {
        if (!client) return;
        await client.query('ROLLBACK');
        client.release();
        if (pool) await pool.end();
    });

    (hasDatabaseUrl ? it : it.skip)('inserts audit row with action=void when voided_at transitions from NULL to timestamp', async () => {
        await client.query(
            `UPDATE payments SET voided_at = NOW() WHERE id = $1`,
            [paymentId],
        );

        const result = await client.query(
            `SELECT entity_type, entity_id, action, metadata FROM audit WHERE entity_id = $1 AND action = 'void'`,
            [paymentId],
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].entity_type).toBe('payment');
        expect(result.rows[0].entity_id).toBe(paymentId);
        expect(result.rows[0].action).toBe('void');
        expect(result.rows[0].metadata).toMatchObject({
            amount: '4000.00',
            contract_id: contractId,
        });
    });

    (hasDatabaseUrl ? it : it.skip)('does NOT insert audit row when voided_at is already set (no double-void)', async () => {
        const auditCountBefore = await client.query(
            `SELECT COUNT(*) FROM audit WHERE entity_id = $1 AND action = 'void'`,
            [paymentId],
        );

        // Update some other field — should not trigger another audit row
        await client.query(
            `UPDATE payments SET voided_at = NOW() WHERE id = $1`,
            [paymentId],
        );

        const auditCountAfter = await client.query(
            `SELECT COUNT(*) FROM audit WHERE entity_id = $1 AND action = 'void'`,
            [paymentId],
        );

        expect(auditCountAfter.rows[0].count).toBe(auditCountBefore.rows[0].count);
    });
});

describe('DB invariant — no hard delete triggers', () => {
    let pool: Pool;
    let client: PoolClient;
    let tenantId: string;
    let contractId: string;
    let payableId: string;
    let paymentId: string;
    let fundId: string;
    let publicAccessCodeId: string;
    let auditId: string;

    beforeAll(async () => {
        if (!hasDatabaseUrl) return;
        pool = new Pool({ connectionString: process.env.DATABASE_URL });
        client = await pool.connect();
        await client.query('BEGIN');

        const tenant = await client.query(
            `INSERT INTO tenants (first_name, last_name) VALUES ('NoDelete', 'Test') RETURNING id`,
        );
        tenantId = tenant.rows[0].id;

        const space = await client.query(
            `INSERT INTO spaces (name) VALUES ('NoDelete Space') RETURNING id`,
        );
        const spaceId = space.rows[0].id;

        const contract = await client.query(
            `INSERT INTO contracts (tenant_id, space_id, start_date, end_date, rent_amount, billing_frequency, due_date_rule, status)
             VALUES ($1, $2, '2024-01-01', '2024-12-31', 3000.00, 'monthly', 1, 'draft') RETURNING id`,
            [tenantId, spaceId],
        );
        contractId = contract.rows[0].id;

        const payable = await client.query(
            `INSERT INTO payables (contract_id, period_start, period_end, amount, due_date)
             VALUES ($1, '2024-01-01', '2024-01-31', 3000.00, '2024-01-05') RETURNING id`,
            [contractId],
        );
        payableId = payable.rows[0].id;

        const payment = await client.query(
            `INSERT INTO payments (contract_id, amount, date)
             VALUES ($1, 3000.00, '2024-01-10') RETURNING id`,
            [contractId],
        );
        paymentId = payment.rows[0].id;

        const fundEntry = await client.query(
            `INSERT INTO fund (contract_id, type, amount)
             VALUES ($1, 'deposit', 3000.00) RETURNING id`,
            [contractId],
        );
        fundId = fundEntry.rows[0].id;

        const pac = await client.query(
            `INSERT INTO public_access_codes (contract_id, code)
             VALUES ($1, gen_random_uuid()) RETURNING id`,
            [contractId],
        );
        publicAccessCodeId = pac.rows[0].id;

        const auditRow = await client.query(
            `INSERT INTO audit (entity_type, entity_id, action)
             VALUES ('payment', $1, 'void') RETURNING id`,
            [paymentId],
        );
        auditId = auditRow.rows[0].id;
    });

    afterAll(async () => {
        if (!client) return;
        await client.query('ROLLBACK');
        client.release();
        if (pool) await pool.end();
    });

    const protectedTables: Array<{ name: string; getId: () => string }> = [
        { name: 'tenants', getId: () => tenantId },
        { name: 'contracts', getId: () => contractId },
        { name: 'payments', getId: () => paymentId },
        { name: 'fund', getId: () => fundId },
        { name: 'payables', getId: () => payableId },
        { name: 'public_access_codes', getId: () => publicAccessCodeId },
        { name: 'audit', getId: () => auditId },
    ];

    for (const { name, getId } of protectedTables) {
        (hasDatabaseUrl ? it : it.skip)(`blocks DELETE on "${name}"`, async () => {
            await client.query(`SAVEPOINT sp_del`);
            await expect(
                client.query(`DELETE FROM ${name} WHERE id = $1`, [getId()]),
            ).rejects.toThrow();
            await client.query('ROLLBACK TO SAVEPOINT sp_del');
        });
    }
});
