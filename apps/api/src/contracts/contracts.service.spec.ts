import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ContractsService, generatePayables } from './contracts.service';
import { DB_TOKEN } from '../database/database.module';

const hasDatabaseUrl = !!process.env.DATABASE_URL;

function buildMockDb({ selectRows = [] as any[], mutationRows = [] as any[] } = {}) {
    const returning = jest.fn().mockResolvedValue(mutationRows);
    const whereForMutation = jest.fn().mockReturnValue({ returning });
    const set = jest.fn().mockReturnValue({ where: whereForMutation });
    const values = jest.fn().mockReturnValue({ returning });
    const whereForSelect = jest.fn().mockResolvedValue(selectRows);
    const leftJoin = jest.fn().mockReturnValue({ where: whereForSelect });
    const from = jest.fn().mockReturnValue({ where: whereForSelect, leftJoin });
    return {
        select: jest.fn().mockReturnValue({ from }),
        insert: jest.fn().mockReturnValue({ values }),
        update: jest.fn().mockReturnValue({ set }),
        transaction: jest.fn(),
        _from: from,
        _leftJoin: leftJoin,
        _whereForSelect: whereForSelect,
        _whereForMutation: whereForMutation,
        _returning: returning,
    };
}

// ────────────────────────────────────────────────────────────────────
// generatePayables — pure helper unit tests
// ────────────────────────────────────────────────────────────────────
describe('generatePayables', () => {
    const contractId = 'contract-uuid';

    it('monthly 3-month range → 3 payables with correct period boundaries', () => {
        const rows = generatePayables({
            contractId,
            startDate: '2024-01-01',
            endDate: '2024-03-31',
            rentAmount: '1000.00',
            billingFrequency: 'monthly',
            dueDateRule: 5,
        });

        expect(rows).toHaveLength(3);
        expect(rows[0]).toMatchObject({ periodStart: '2024-01-01', periodEnd: '2024-01-31', dueDate: '2024-01-05', amount: '1000.00' });
        expect(rows[1]).toMatchObject({ periodStart: '2024-02-01', periodEnd: '2024-02-29', dueDate: '2024-02-05' });
        expect(rows[2]).toMatchObject({ periodStart: '2024-03-01', periodEnd: '2024-03-31', dueDate: '2024-03-05' });
    });

    it('dueDate clamped in February when dueDateRule=31 → day 29 (leap) or 28', () => {
        const rows = generatePayables({
            contractId,
            startDate: '2024-02-01',
            endDate: '2024-02-29',
            rentAmount: '500.00',
            billingFrequency: 'monthly',
            dueDateRule: 31,
        });

        expect(rows).toHaveLength(1);
        expect(rows[0].dueDate).toBe('2024-02-29'); // 2024 is a leap year
    });

    it('dueDate clamped in non-leap February when dueDateRule=31 → day 28', () => {
        const rows = generatePayables({
            contractId,
            startDate: '2023-02-01',
            endDate: '2023-02-28',
            rentAmount: '500.00',
            billingFrequency: 'monthly',
            dueDateRule: 31,
        });

        expect(rows).toHaveLength(1);
        expect(rows[0].dueDate).toBe('2023-02-28');
    });

    it('last period periodEnd clamped to endDate', () => {
        const rows = generatePayables({
            contractId,
            startDate: '2024-01-15',
            endDate: '2024-03-20',
            rentAmount: '800.00',
            billingFrequency: 'monthly',
            dueDateRule: 1,
        });

        expect(rows).toHaveLength(3);
        expect(rows[2].periodEnd).toBe('2024-03-20');
    });

    it('quarterly produces 3-month periods', () => {
        const rows = generatePayables({
            contractId,
            startDate: '2024-01-01',
            endDate: '2024-09-30',
            rentAmount: '3000.00',
            billingFrequency: 'quarterly',
            dueDateRule: 1,
        });

        expect(rows).toHaveLength(3);
        expect(rows[0]).toMatchObject({ periodStart: '2024-01-01', periodEnd: '2024-03-31' });
        expect(rows[1]).toMatchObject({ periodStart: '2024-04-01', periodEnd: '2024-06-30' });
        expect(rows[2]).toMatchObject({ periodStart: '2024-07-01', periodEnd: '2024-09-30' });
    });

    it('annually 2-year range → 2 payables', () => {
        const rows = generatePayables({
            contractId,
            startDate: '2024-01-01',
            endDate: '2025-12-31',
            rentAmount: '12000.00',
            billingFrequency: 'annually',
            dueDateRule: 1,
        });

        expect(rows).toHaveLength(2);
        expect(rows[0]).toMatchObject({ periodStart: '2024-01-01', periodEnd: '2024-12-31' });
        expect(rows[1]).toMatchObject({ periodStart: '2025-01-01', periodEnd: '2025-12-31' });
    });

    it('startDate > endDate → empty array', () => {
        const rows = generatePayables({
            contractId,
            startDate: '2024-06-01',
            endDate: '2024-01-01',
            rentAmount: '1000.00',
            billingFrequency: 'monthly',
            dueDateRule: 5,
        });

        expect(rows).toHaveLength(0);
    });

    it('addMonths clamping: Jan 31 + 1 month → Feb 28/29, not March 3', () => {
        const rows = generatePayables({
            contractId,
            startDate: '2024-01-31',
            endDate: '2024-03-31',
            rentAmount: '1000.00',
            billingFrequency: 'monthly',
            dueDateRule: 1,
        });

        expect(rows.length).toBeGreaterThan(0);
        // Second period starts Feb 28/29, not March 3
        expect(rows[1].periodStart).toMatch(/^2024-02-/);
    });
});

// ────────────────────────────────────────────────────────────────────
// ContractsService — unit tests
// ────────────────────────────────────────────────────────────────────
describe('ContractsService', () => {
    async function createService(mockDb: any) {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContractsService,
                { provide: DB_TOKEN, useValue: mockDb },
            ],
        }).compile();
        return module.get<ContractsService>(ContractsService);
    }

    const draftContract = {
        id: 'contract-1',
        tenantId: 'tenant-1',
        spaceId: 'space-1',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        rentAmount: '1000.00',
        billingFrequency: 'monthly',
        dueDateRule: 5,
        depositAmount: '2000.00',
        advanceMonths: 1,
        status: 'draft',
    };

    const postedContract = { ...draftContract, status: 'posted' };

    describe('findAll', () => {
        it('returns all contracts using leftJoin', async () => {
            const rows = [{ ...draftContract, tenantName: 'Alice Smith' }];
            const mockDb = buildMockDb({ selectRows: rows });
            const service = await createService(mockDb);

            const result = await service.findAll();

            expect(mockDb._leftJoin).toHaveBeenCalled();
            expect(result).toEqual(rows);
        });
    });

    describe('findOne', () => {
        it('returns contract by id', async () => {
            const mockDb = buildMockDb({ selectRows: [draftContract] });
            const service = await createService(mockDb);

            const result = await service.findOne('contract-1');

            expect(result).toEqual(draftContract);
        });

        it('throws NotFoundException when no rows returned', async () => {
            const mockDb = buildMockDb({ selectRows: [] });
            const service = await createService(mockDb);

            await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('inserts contract and returns row', async () => {
            const mockDb = buildMockDb({ mutationRows: [draftContract] });
            const service = await createService(mockDb);

            const result = await service.create({
                tenantId: 'tenant-1',
                spaceId: 'space-1',
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                rentAmount: '1000.00',
                billingFrequency: 'monthly',
                dueDateRule: 5,
            });

            expect(mockDb.insert).toHaveBeenCalled();
            expect(result).toEqual(draftContract);
        });
    });

    describe('update', () => {
        it('updates draft contract and returns row', async () => {
            const updated = { ...draftContract, rentAmount: '1200.00' };
            const mockDb = buildMockDb({ mutationRows: [updated] });
            // first select (findOne) returns draft
            mockDb.select
                .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([draftContract]), leftJoin: jest.fn() }) })
                .mockReturnValue({ from: mockDb._from });
            const service = await createService(mockDb);

            const result = await service.update('contract-1', { rentAmount: '1200.00' });

            expect(mockDb.update).toHaveBeenCalled();
            expect(result).toEqual(updated);
        });

        it('throws BadRequestException before DB call when contract is posted', async () => {
            const mockDb = buildMockDb();
            mockDb.select
                .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([postedContract]), leftJoin: jest.fn() }) });
            const service = await createService(mockDb);

            await expect(service.update('contract-1', { rentAmount: '1200.00' })).rejects.toThrow(BadRequestException);
            expect(mockDb.update).not.toHaveBeenCalled();
        });
    });

    describe('post', () => {
        function buildTxMock(contractRow: any) {
            const tx = {
                update: jest.fn().mockReturnValue({
                    set: jest.fn().mockReturnValue({
                        where: jest.fn().mockReturnValue({
                            returning: jest.fn().mockResolvedValue([contractRow]),
                        }),
                    }),
                }),
                insert: jest.fn().mockReturnValue({
                    values: jest.fn().mockReturnValue({
                        returning: jest.fn().mockResolvedValue([]),
                    }),
                }),
            };
            return tx;
        }

        it('executes full transaction: status update, publicAccessCode, fund, payment, payables', async () => {
            const mockDb = buildMockDb();
            mockDb.select
                .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([draftContract]), leftJoin: jest.fn() }) });
            const tx = buildTxMock(postedContract);
            mockDb.transaction.mockImplementation(async (fn: any) => fn(tx));
            const service = await createService(mockDb);

            const result = await service.post('contract-1');

            expect(result).toEqual(postedContract);
            expect(tx.update).toHaveBeenCalled(); // status → posted
            // All 4 inserts: publicAccessCodes, fund, payments, payables
            expect(tx.insert).toHaveBeenCalledTimes(4);
        });

        it('skips fund insert when depositAmount is null', async () => {
            const contractNoDeposit = { ...draftContract, depositAmount: null };
            const mockDb = buildMockDb();
            mockDb.select
                .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([contractNoDeposit]), leftJoin: jest.fn() }) });
            const tx = buildTxMock({ ...postedContract, depositAmount: null });
            mockDb.transaction.mockImplementation(async (fn: any) => fn(tx));
            const service = await createService(mockDb);

            await service.post('contract-1');

            // publicAccessCodes + payments + payables = 3 (no fund)
            expect(tx.insert).toHaveBeenCalledTimes(3);
        });

        it('skips payment insert when advanceMonths = 0', async () => {
            const contractNoAdvance = { ...draftContract, advanceMonths: 0 };
            const mockDb = buildMockDb();
            mockDb.select
                .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([contractNoAdvance]), leftJoin: jest.fn() }) });
            const tx = buildTxMock({ ...postedContract, advanceMonths: 0 });
            mockDb.transaction.mockImplementation(async (fn: any) => fn(tx));
            const service = await createService(mockDb);

            await service.post('contract-1');

            // publicAccessCodes + fund + payables = 3 (no payment)
            expect(tx.insert).toHaveBeenCalledTimes(3);
        });

        it('catches PG error 23505 → ConflictException', async () => {
            const mockDb = buildMockDb();
            mockDb.select
                .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([draftContract]), leftJoin: jest.fn() }) });
            mockDb.transaction.mockImplementation(async () => {
                const err: any = new Error('unique violation');
                err.code = '23505';
                throw err;
            });
            const service = await createService(mockDb);

            await expect(service.post('contract-1')).rejects.toThrow(ConflictException);
        });

        it('re-throws non-23505 errors', async () => {
            const mockDb = buildMockDb();
            mockDb.select
                .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([draftContract]), leftJoin: jest.fn() }) });
            mockDb.transaction.mockImplementation(async () => {
                const err: any = new Error('some other db error');
                err.code = '42000';
                throw err;
            });
            const service = await createService(mockDb);

            await expect(service.post('contract-1')).rejects.toThrow('some other db error');
        });
    });
});

// ────────────────────────────────────────────────────────────────────
// Integration tests (skipped when DATABASE_URL is not set)
// ────────────────────────────────────────────────────────────────────
(hasDatabaseUrl ? describe : describe.skip)('ContractsService — DB integration', () => {
    let service: ContractsService;
    const testSpaceId = require('crypto').randomUUID();
    const testTenantId = require('crypto').randomUUID();

    beforeAll(async () => {
        const { db } = await import('../database/database');
        const { spaces, tenants } = await import('../database/schema');

        await db.insert(spaces).values({ id: testSpaceId, name: `Test Space ${testSpaceId}` });
        await db.insert(tenants).values({ id: testTenantId, firstName: 'Test', lastName: 'Tenant' });

        service = new ContractsService(db);
    });

    const baseContractData = () => ({
        tenantId: testTenantId,
        spaceId: testSpaceId,
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        rentAmount: '1000.00',
        billingFrequency: 'monthly' as const,
        dueDateRule: 5,
        depositAmount: '2000.00',
        advanceMonths: 1,
    });

    it('create → findOne returns draft', async () => {
        const created = await service.create(baseContractData());
        expect(created.status).toBe('draft');

        const found = await service.findOne(created.id);
        expect(found.id).toBe(created.id);
        expect(found.status).toBe('draft');
    });

    it('post → status posted, payables exist, publicAccessCode exists', async () => {
        const { db } = await import('../database/database');
        const { payables, publicAccessCodes } = await import('../database/schema');
        const { eq } = await import('drizzle-orm');

        const uniqueSpaceId = require('crypto').randomUUID();
        const { spaces } = await import('../database/schema');
        await db.insert(spaces).values({ id: uniqueSpaceId, name: `Post Test Space ${uniqueSpaceId}` });

        const contract = await service.create({ ...baseContractData(), spaceId: uniqueSpaceId });
        const posted = await service.post(contract.id);

        expect(posted.status).toBe('posted');

        const pRows = await db.select().from(payables).where(eq(payables.contractId, contract.id));
        expect(pRows.length).toBeGreaterThan(0);

        const codes = await db.select().from(publicAccessCodes).where(eq(publicAccessCodes.contractId, contract.id));
        expect(codes).toHaveLength(1);
    });

    it('post same space twice → ConflictException', async () => {
        const uniqueSpaceId = require('crypto').randomUUID();
        const { db } = await import('../database/database');
        const { spaces } = await import('../database/schema');
        await db.insert(spaces).values({ id: uniqueSpaceId, name: `Conflict Test Space ${uniqueSpaceId}` });

        const c1 = await service.create({ ...baseContractData(), spaceId: uniqueSpaceId });
        await service.post(c1.id);

        const c2 = await service.create({ ...baseContractData(), spaceId: uniqueSpaceId });
        await expect(service.post(c2.id)).rejects.toThrow(ConflictException);
    });

    it('update posted → BadRequestException', async () => {
        const uniqueSpaceId = require('crypto').randomUUID();
        const { db } = await import('../database/database');
        const { spaces } = await import('../database/schema');
        await db.insert(spaces).values({ id: uniqueSpaceId, name: `Update Test Space ${uniqueSpaceId}` });

        const contract = await service.create({ ...baseContractData(), spaceId: uniqueSpaceId });
        await service.post(contract.id);

        await expect(service.update(contract.id, { rentAmount: '999.00' })).rejects.toThrow(BadRequestException);
    });
});
