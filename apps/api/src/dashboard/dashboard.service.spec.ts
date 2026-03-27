import { DashboardService } from './dashboard.service';

const REF_DATE = '2024-01-10'; // today + 7 = '2024-01-17'

function makeSelectChain(rows: any[]) {
    const where = jest.fn().mockResolvedValue(rows);
    const leftJoin = jest.fn().mockReturnValue({ where });
    const from = jest.fn().mockReturnValue({ where, leftJoin });
    return { from };
}

function buildMockDb(selectResults: any[][]) {
    const select = jest.fn();
    for (const rows of selectResults) {
        select.mockReturnValueOnce(makeSelectChain(rows));
    }
    return { select };
}

describe('DashboardService', () => {
    function makeService(selectResults: any[][]) {
        return new DashboardService(buildMockDb(selectResults) as any);
    }

    const space1 = { id: 's1', name: 'Space 1', description: null, deletedAt: null };
    const contract1 = {
        id: 'c1', spaceId: 's1', tenantId: 't1', tenantName: 'John Doe', status: 'posted',
    };

    it('1 · no spaces, no contracts → []', async () => {
        const service = makeService([[], []]);
        expect(await service.getDashboard(REF_DATE)).toEqual([]);
    });

    it('2 · space with no posted contract → vacant', async () => {
        const service = makeService([[space1], []]);
        const [entry] = await service.getDashboard(REF_DATE);
        expect(entry.occupancyStatus).toBe('vacant');
        expect(entry.amountDue).toBeUndefined();
        expect(entry.tenantId).toBeUndefined();
    });

    it('3 · paid-up, next due > 7 days → occupied', async () => {
        const service = makeService([
            [space1],
            [contract1],
            [{ contractId: 'c1', dueDate: '2024-02-01', amount: '1000.00' }],
            [],
        ]);
        const [entry] = await service.getDashboard(REF_DATE);
        expect(entry.occupancyStatus).toBe('occupied');
    });

    it('4 · past-due payable and amount_due > 0 → overdue with amountDue populated', async () => {
        const service = makeService([
            [space1],
            [contract1],
            [{ contractId: 'c1', dueDate: '2024-01-05', amount: '1000.00' }],
            [],
        ]);
        const [entry] = await service.getDashboard(REF_DATE);
        expect(entry.occupancyStatus).toBe('overdue');
        expect(entry.amountDue).toBe('1000.00');
    });

    it('5 · paid up, next due ≤ 7 days → nearing with nextDueDate populated', async () => {
        const service = makeService([
            [space1],
            [contract1],
            [
                { contractId: 'c1', dueDate: '2024-01-05', amount: '1000.00' },
                { contractId: 'c1', dueDate: '2024-01-15', amount: '1000.00' },
            ],
            [{ contractId: 'c1', amount: '1000.00', voidedAt: null }],
        ]);
        const [entry] = await service.getDashboard(REF_DATE);
        expect(entry.occupancyStatus).toBe('nearing');
        expect(entry.nextDueDate).toBe('2024-01-15');
    });

    it('6 · all four statuses → sort order overdue, nearing, occupied, vacant', async () => {
        const spaces = [
            { id: 'sv', name: 'Vacant', description: null, deletedAt: null },
            { id: 'so', name: 'Occupied', description: null, deletedAt: null },
            { id: 'sn', name: 'Nearing', description: null, deletedAt: null },
            { id: 'sd', name: 'Overdue', description: null, deletedAt: null },
        ];
        const contracts = [
            { id: 'co', spaceId: 'so', tenantId: 't1', tenantName: 'Alice Smith', status: 'posted' },
            { id: 'cn', spaceId: 'sn', tenantId: 't2', tenantName: 'Bob Jones', status: 'posted' },
            { id: 'cd', spaceId: 'sd', tenantId: 't3', tenantName: 'Carol Lee', status: 'posted' },
        ];
        const testPayables = [
            { contractId: 'co', dueDate: '2024-02-01', amount: '1000.00' },
            { contractId: 'cn', dueDate: '2024-01-05', amount: '1000.00' },
            { contractId: 'cn', dueDate: '2024-01-15', amount: '1000.00' },
            { contractId: 'cd', dueDate: '2024-01-05', amount: '1000.00' },
        ];
        const testPayments = [
            { contractId: 'cn', amount: '1000.00', voidedAt: null },
        ];
        const service = makeService([spaces, contracts, testPayables, testPayments]);
        const result = await service.getDashboard(REF_DATE);
        expect(result).toHaveLength(4);
        expect(result[0].occupancyStatus).toBe('overdue');
        expect(result[1].occupancyStatus).toBe('nearing');
        expect(result[2].occupancyStatus).toBe('occupied');
        expect(result[3].occupancyStatus).toBe('vacant');
    });

    it('7 · past-due payable but fully paid → occupied (not overdue)', async () => {
        const service = makeService([
            [space1],
            [contract1],
            [{ contractId: 'c1', dueDate: '2024-01-05', amount: '1000.00' }],
            [{ contractId: 'c1', amount: '1000.00', voidedAt: null }],
        ]);
        const [entry] = await service.getDashboard(REF_DATE);
        expect(entry.occupancyStatus).toBe('occupied');
        expect(entry.amountDue).toBe('0.00');
    });

    it('8 · voided payment excluded from totalPaid → correct amountDue', async () => {
        const service = makeService([
            [space1],
            [contract1],
            [{ contractId: 'c1', dueDate: '2024-01-05', amount: '1000.00' }],
            [
                { contractId: 'c1', amount: '1000.00', voidedAt: new Date() },
                { contractId: 'c1', amount: '500.00', voidedAt: null },
            ],
        ]);
        const [entry] = await service.getDashboard(REF_DATE);
        expect(entry.occupancyStatus).toBe('overdue');
        expect(entry.amountDue).toBe('500.00');
    });

    it('9 · multiple payables → nextDueDate = earliest upcoming', async () => {
        const service = makeService([
            [space1],
            [contract1],
            [
                { contractId: 'c1', dueDate: '2024-02-01', amount: '1000.00' },
                { contractId: 'c1', dueDate: '2024-01-20', amount: '1000.00' },
            ],
            [],
        ]);
        const [entry] = await service.getDashboard(REF_DATE);
        expect(entry.nextDueDate).toBe('2024-01-20');
        expect(entry.occupancyStatus).toBe('occupied'); // > 7 days from refDate
    });

    it('10 · amountDue undefined for vacant spaces', async () => {
        const service = makeService([[space1], []]);
        const [entry] = await service.getDashboard(REF_DATE);
        expect(entry.amountDue).toBeUndefined();
    });
});
