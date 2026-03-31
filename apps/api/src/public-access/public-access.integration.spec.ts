const hasDatabaseUrl = !!process.env.DATABASE_URL;

(hasDatabaseUrl ? describe : describe.skip)('PublicAccessService — DB integration', () => {
    const testSpaceId = require('crypto').randomUUID();
    const testTenantId = require('crypto').randomUUID();

    let contractId: string;
    let accessCode: string;
    let publicAccessService: any;
    let contractsService: any;

    beforeAll(async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const db = require('../database/database').db;
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { spaces, tenants, publicAccessCodes } = require('../database/schema');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { ContractsService } = require('../contracts/contracts.service');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { LedgersService } = require('../ledgers/ledgers.service');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { PublicAccessService } = require('./public-access.service');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { eq } = require('drizzle-orm');

        await db.insert(spaces).values({ id: testSpaceId, name: `PATest Space ${testSpaceId}` });
        await db.insert(tenants).values({ id: testTenantId, firstName: 'PATest', lastName: 'Tenant' });

        contractsService = new ContractsService(db);
        const ledgersService = new LedgersService(db);
        publicAccessService = new PublicAccessService(db, ledgersService);

        const contract = await contractsService.create({
            tenantId: testTenantId,
            spaceId: testSpaceId,
            startDate: '2024-01-01',
            endDate: '2024-03-31',
            rentAmount: '1000.00',
            billingFrequency: 'monthly',
            dueDateRule: 5,
        });
        contractId = contract.id;

        await contractsService.post(contractId);
        const codes = await db.select().from(publicAccessCodes).where(eq(publicAccessCodes.contractId, contractId));
        accessCode = codes[0].code;
    });

    it('getPublicStatus returns ledger for a valid code', async () => {
        const result = await publicAccessService.getPublicStatus(accessCode);
        expect(result.contractId).toBe(contractId);
        expect(result.ledger).toBeDefined();
        expect(result.ledger.payables).toBeInstanceOf(Array);
        expect(result.ledger.amount_due).toBeDefined();
    });

    it('getPublicStatus throws NotFoundException for unknown code', async () => {
        const { NotFoundException } = require('@nestjs/common');
        await expect(publicAccessService.getPublicStatus('00000000-0000-0000-0000-000000000000')).rejects.toThrow(NotFoundException);
    });

    it('revoke → getPublicStatus throws NotFoundException', async () => {
        const { NotFoundException } = require('@nestjs/common');
        await contractsService.revokeAccessCode(contractId);
        await expect(publicAccessService.getPublicStatus(accessCode)).rejects.toThrow(NotFoundException);
    });
});
