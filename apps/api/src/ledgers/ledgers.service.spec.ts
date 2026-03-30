import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LedgersService } from './ledgers.service';
import { DB_TOKEN } from '../database/database.module';

const hasDatabaseUrl = !!process.env.DATABASE_URL;

// ────────────────────────────────────────────────────────────────────
// Mock helpers
// ────────────────────────────────────────────────────────────────────

function makeSelect(rows: any[]) {
    const where = jest.fn().mockResolvedValue(rows);
    const from = jest.fn().mockReturnValue({ where });
    return { select: jest.fn().mockReturnValue({ from }), _where: where };
}

function buildMockDbForLedger({
    payableRows = [] as any[],
    paymentRows = [] as any[],
    fundRows = [] as any[],
} = {}) {
    const payablesWhere = jest.fn().mockResolvedValue(payableRows);
    const paymentsWhere = jest.fn().mockResolvedValue(paymentRows);
    const fundWhere = jest.fn().mockResolvedValue(fundRows);

    const payablesFrom = jest.fn().mockReturnValue({ where: payablesWhere });
    const paymentsFrom = jest.fn().mockReturnValue({ where: paymentsWhere });
    const fundFrom = jest.fn().mockReturnValue({ where: fundWhere });

    const returning = jest.fn().mockResolvedValue([]);
    const whereForMutation = jest.fn().mockReturnValue({ returning });
    const set = jest.fn().mockReturnValue({ where: whereForMutation });
    const values = jest.fn().mockReturnValue({ returning });

    return {
        select: jest.fn()
            .mockReturnValueOnce({ from: payablesFrom })
            .mockReturnValueOnce({ from: paymentsFrom })
            .mockReturnValueOnce({ from: fundFrom }),
        insert: jest.fn().mockReturnValue({ values }),
        update: jest.fn().mockReturnValue({ set }),
        _returning: returning,
        _whereForMutation: whereForMutation,
    };
}

function buildMockDbForVoid({
    selectRows = [] as any[],
    mutationRows = [] as any[],
} = {}) {
    const where = jest.fn().mockResolvedValue(selectRows);
    const from = jest.fn().mockReturnValue({ where });

    const returning = jest.fn().mockResolvedValue(mutationRows);
    const whereForMutation = jest.fn().mockReturnValue({ returning });
    const set = jest.fn().mockReturnValue({ where: whereForMutation });

    return {
        select: jest.fn().mockReturnValue({ from }),
        update: jest.fn().mockReturnValue({ set }),
        _returning: returning,
    };
}

function buildMockDbForInsert({ mutationRows = [] as any[] } = {}) {
    const returning = jest.fn().mockResolvedValue(mutationRows);
    const values = jest.fn().mockReturnValue({ returning });

    return {
        insert: jest.fn().mockReturnValue({ values }),
    };
}

function buildMockDbForRecordPayment({ contractRow = null as any, mutationRows = [] as any[] } = {}) {
    const contractWhere = jest.fn().mockResolvedValue(contractRow ? [contractRow] : []);
    const contractFrom = jest.fn().mockReturnValue({ where: contractWhere });

    const returning = jest.fn().mockResolvedValue(mutationRows);
    const values = jest.fn().mockReturnValue({ returning });

    return {
        select: jest.fn().mockReturnValue({ from: contractFrom }),
        insert: jest.fn().mockReturnValue({ values }),
    };
}

async function createService(mockDb: any): Promise<LedgersService> {
    const module = await Test.createTestingModule({
        providers: [
            LedgersService,
            { provide: DB_TOKEN, useValue: mockDb },
        ],
    }).compile();
    return module.get(LedgersService);
}

// ────────────────────────────────────────────────────────────────────
// getLedger
// ────────────────────────────────────────────────────────────────────

describe('LedgersService.getLedger', () => {
    const contractId = 'contract-uuid';

    it('standard: owed 2000, paid 800 → amount_due = 1200.00', async () => {
        const today = new Date().toISOString().split('T')[0];
        const payableRows = [
            { id: 'p1', contractId, dueDate: today, amount: '1000.00', periodStart: '2024-01-01', periodEnd: '2024-01-31' },
            { id: 'p2', contractId, dueDate: today, amount: '1000.00', periodStart: '2024-02-01', periodEnd: '2024-02-29' },
        ];
        const paymentRows = [
            { id: 'pm1', contractId, amount: '800.00', voidedAt: null },
        ];
        const fundRows = [
            { id: 'f1', contractId, type: 'deposit', amount: '500.00' },
        ];

        const mockDb = buildMockDbForLedger({ payableRows, paymentRows, fundRows });
        const service = await createService(mockDb);

        const result = await service.getLedger(contractId);

        expect(result.payables).toEqual(payableRows);
        expect(result.payments).toEqual(paymentRows);
        expect(result.fund).toEqual(fundRows);
        expect(result.amount_due).toBe('1200.00');
    });

    it('future payable not yet due → excluded from amount_due', async () => {
        const futureDate = '2099-12-31';
        const payableRows = [
            { id: 'p1', contractId, dueDate: futureDate, amount: '1000.00', periodStart: '2099-12-01', periodEnd: '2099-12-31' },
        ];
        const mockDb = buildMockDbForLedger({ payableRows });
        const service = await createService(mockDb);

        const result = await service.getLedger(contractId);
        expect(result.amount_due).toBe('0.00');
    });

    it('overpaid → amount_due clamped to 0.00', async () => {
        const today = new Date().toISOString().split('T')[0];
        const payableRows = [
            { id: 'p1', contractId, dueDate: today, amount: '1000.00', periodStart: '2024-01-01', periodEnd: '2024-01-31' },
        ];
        const paymentRows = [
            { id: 'pm1', contractId, amount: '1500.00', voidedAt: null },
        ];

        const mockDb = buildMockDbForLedger({ payableRows, paymentRows });
        const service = await createService(mockDb);

        const result = await service.getLedger(contractId);
        expect(result.amount_due).toBe('0.00');
    });

    it('voided payments are excluded from totalPaid', async () => {
        const today = new Date().toISOString().split('T')[0];
        const payableRows = [
            { id: 'p1', contractId, dueDate: today, amount: '1000.00', periodStart: '2024-01-01', periodEnd: '2024-01-31' },
        ];
        const paymentRows = [
            { id: 'pm1', contractId, amount: '600.00', voidedAt: null },
            { id: 'pm2', contractId, amount: '400.00', voidedAt: new Date() },
        ];

        const mockDb = buildMockDbForLedger({ payableRows, paymentRows });
        const service = await createService(mockDb);

        const result = await service.getLedger(contractId);
        // only pm1 (600) counts; 1000 - 600 = 400
        expect(result.amount_due).toBe('400.00');
    });

    it('custom referenceDate filters payables correctly', async () => {
        const payableRows = [
            { id: 'p1', contractId, dueDate: '2024-03-01', amount: '1000.00', periodStart: '2024-03-01', periodEnd: '2024-03-31' },
            { id: 'p2', contractId, dueDate: '2024-04-01', amount: '1000.00', periodStart: '2024-04-01', periodEnd: '2024-04-30' },
        ];

        const mockDb = buildMockDbForLedger({ payableRows });
        const service = await createService(mockDb);

        const result = await service.getLedger(contractId, '2024-03-15');
        // only p1 dueDate='2024-03-01' <= '2024-03-15'
        expect(result.amount_due).toBe('1000.00');
    });

    it('fund present but does NOT affect amount_due', async () => {
        const today = new Date().toISOString().split('T')[0];
        const payableRows = [
            { id: 'p1', contractId, dueDate: today, amount: '1000.00', periodStart: '2024-01-01', periodEnd: '2024-01-31' },
        ];
        const fundRows = [
            { id: 'f1', contractId, type: 'deposit', amount: '9999.00' },
        ];

        const mockDb = buildMockDbForLedger({ payableRows, fundRows });
        const service = await createService(mockDb);

        const result = await service.getLedger(contractId);
        // fund does not offset amount_due
        expect(result.amount_due).toBe('1000.00');
    });

    it('no payables and no payments → amount_due = 0.00', async () => {
        const mockDb = buildMockDbForLedger();
        const service = await createService(mockDb);

        const result = await service.getLedger(contractId);
        expect(result.amount_due).toBe('0.00');
    });
});

// ────────────────────────────────────────────────────────────────────
// recordPayment
// ────────────────────────────────────────────────────────────────────

describe('LedgersService.recordPayment', () => {
    const contractId = 'contract-uuid';

    it('inserts payment with provided date', async () => {
        const activeContract = { id: contractId, status: 'posted' };
        const newPayment = { id: 'pm-new', contractId, amount: '500.00', date: '2024-06-01', voidedAt: null };
        const mockDb = buildMockDbForRecordPayment({ contractRow: activeContract, mutationRows: [newPayment] });
        const service = await createService(mockDb);

        const result = await service.recordPayment(contractId, { amount: '500.00', date: '2024-06-01' });

        expect(result).toEqual(newPayment);
        const [insertedValues] = mockDb.insert().values.mock.calls;
        expect(insertedValues[0]).toMatchObject({ contractId, amount: '500.00', date: '2024-06-01' });
    });

    it('defaults date to today when not provided', async () => {
        const today = new Date().toISOString().split('T')[0];
        const activeContract = { id: contractId, status: 'posted' };
        const newPayment = { id: 'pm-new', contractId, amount: '200.00', date: today, voidedAt: null };
        const mockDb = buildMockDbForRecordPayment({ contractRow: activeContract, mutationRows: [newPayment] });
        const service = await createService(mockDb);

        await service.recordPayment(contractId, { amount: '200.00' });

        const [insertedValues] = mockDb.insert().values.mock.calls;
        expect(insertedValues[0].date).toBe(today);
    });

    it('throws BadRequestException when contract is voided', async () => {
        const voidedContract = { id: contractId, status: 'voided' };
        const mockDb = buildMockDbForRecordPayment({ contractRow: voidedContract });
        const service = await createService(mockDb);

        await expect(service.recordPayment(contractId, { amount: '500.00' }))
            .rejects.toThrow(BadRequestException);
        expect(mockDb.insert).not.toHaveBeenCalled();
    });
});

// ────────────────────────────────────────────────────────────────────
// voidPayment
// ────────────────────────────────────────────────────────────────────

describe('LedgersService.voidPayment', () => {
    it('sets voidedAt on the payment', async () => {
        const paymentId = 'pm-uuid';
        const existingPayment = { id: paymentId, contractId: 'c-uuid', amount: '500.00', voidedAt: null };
        const voidedPayment = { ...existingPayment, voidedAt: new Date() };

        const mockDb = buildMockDbForVoid({ selectRows: [existingPayment], mutationRows: [voidedPayment] });
        const service = await createService(mockDb);

        const result = await service.voidPayment(paymentId);
        expect(result.voidedAt).toBeTruthy();
    });

    it('throws NotFoundException when payment does not exist', async () => {
        const mockDb = buildMockDbForVoid({ selectRows: [] });
        const service = await createService(mockDb);

        await expect(service.voidPayment('nonexistent-id')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when payment is already voided', async () => {
        const paymentId = 'pm-uuid';
        const alreadyVoided = { id: paymentId, contractId: 'c-uuid', amount: '500.00', voidedAt: new Date() };

        const mockDb = buildMockDbForVoid({ selectRows: [alreadyVoided] });
        const service = await createService(mockDb);

        await expect(service.voidPayment(paymentId)).rejects.toThrow(BadRequestException);
    });
});

// ────────────────────────────────────────────────────────────────────
// Integration tests
// ────────────────────────────────────────────────────────────────────

(hasDatabaseUrl ? describe : describe.skip)('LedgersService integration', () => {
    let service: LedgersService;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let db: any;
    let contractId: string;

    const testSpaceId = require('crypto').randomUUID();
    const testTenantId = require('crypto').randomUUID();

    beforeAll(async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        db = require('../database/database').db;
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { spaces, tenants } = require('../database/schema');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { ContractsService } = require('../contracts/contracts.service');

        await db.insert(spaces).values({ id: testSpaceId, name: `Ledger Test Space ${testSpaceId}` });
        await db.insert(tenants).values({ id: testTenantId, firstName: 'Ledger', lastName: 'Tester' });

        const contractsService = new ContractsService(db);
        const contract = await contractsService.create({
            tenantId: testTenantId,
            spaceId: testSpaceId,
            startDate: '2024-01-01',
            endDate: '2024-03-31',
            rentAmount: '1000.00',
            billingFrequency: 'monthly',
            dueDateRule: 5,
            depositAmount: '2000.00',
            advanceMonths: 1,
        });
        await contractsService.post(contract.id);
        contractId = contract.id;

        service = new LedgersService(db);
    });

    it('getLedger returns real data from DB', async () => {
        const ledger = await service.getLedger(contractId);

        expect(ledger.payables.length).toBe(3);
        expect(ledger.fund.length).toBe(1);
        expect(ledger.fund[0].type).toBe('deposit');
        expect(ledger.payments.length).toBe(1);
        // 3 payables (Jan/Feb/Mar 2024, all past) = 3000 owed; 1 advance payment = 1000 paid
        expect(ledger.amount_due).toBe('2000.00');
    });

    it('recordPayment inserts into payments table', async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { payments } = require('../database/schema');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { eq } = require('drizzle-orm');

        const result = await service.recordPayment(contractId, { amount: '500.00' });

        expect(result.id).toBeTruthy();
        expect(result.amount).toBe('500.00');

        const rows = await db.select().from(payments).where(eq(payments.id, result.id));
        expect(rows).toHaveLength(1);
    });

    it('voidPayment sets voided_at and triggers audit insert', async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { audit } = require('../database/schema');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { eq } = require('drizzle-orm');

        const payment = await service.recordPayment(contractId, { amount: '100.00' });
        const result = await service.voidPayment(payment.id);

        expect(result.voidedAt).toBeTruthy();

        const auditRows = await db.select().from(audit).where(eq(audit.entityId, payment.id));
        expect(auditRows).toHaveLength(1);
        expect(auditRows[0].action).toBe('void');
    });
});
