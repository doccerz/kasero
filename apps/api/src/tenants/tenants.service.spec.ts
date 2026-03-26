import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { SettingsService } from '../settings/settings.service';
import { DB_TOKEN } from '../database/database.module';

const hasDatabaseUrl = !!process.env.DATABASE_URL;

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const activeTenant = { id: '1', firstName: 'Alice', lastName: 'Smith', expirationDate: tomorrow };
const expiredTenant = { id: '2', firstName: 'Bob', lastName: 'Jones', expirationDate: yesterday };
const nullExpiryTenant = { id: '3', firstName: 'Carol', lastName: 'Doe', expirationDate: null };

function buildMockDb(rows: object[]) {
    const filteredRows = rows.filter((r: any) => {
        if (r.expirationDate === null) return true;
        return r.expirationDate > today;
    });
    const whereMock = jest.fn().mockResolvedValue(filteredRows);
    const queryObj = {
        where: whereMock,
        then: (resolve: any, reject: any) => Promise.resolve(rows).then(resolve, reject),
    };
    const fromMock = jest.fn().mockReturnValue(queryObj);
    return {
        select: jest.fn().mockReturnValue({ from: fromMock }),
        _fromMock: fromMock,
        _whereMock: whereMock,
    };
}

describe('TenantsService', () => {
    let service: TenantsService;
    let settingsService: { getBoolean: jest.Mock };

    async function createService(hideExpired: boolean, rows: object[]) {
        const mockDb = buildMockDb(rows);
        settingsService = { getBoolean: jest.fn().mockReturnValue(hideExpired) };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TenantsService,
                { provide: DB_TOKEN, useValue: mockDb },
                { provide: SettingsService, useValue: settingsService },
            ],
        }).compile();

        service = module.get<TenantsService>(TenantsService);
        return mockDb;
    }

    describe('findAll', () => {
        it('returns all tenants when tenant.hide_expired = false', async () => {
            const rows = [activeTenant, expiredTenant, nullExpiryTenant];
            const mockDb = await createService(false, rows);

            const result = await service.findAll();

            expect(settingsService.getBoolean).toHaveBeenCalledWith('tenant.hide_expired');
            expect(mockDb._fromMock).toHaveBeenCalled();
            expect(mockDb._whereMock).not.toHaveBeenCalled();
            expect(result).toEqual(rows);
        });

        it('filters out expired tenants when tenant.hide_expired = true', async () => {
            const rows = [activeTenant, expiredTenant, nullExpiryTenant];
            const mockDb = await createService(true, rows);

            const result = await service.findAll();

            expect(settingsService.getBoolean).toHaveBeenCalledWith('tenant.hide_expired');
            expect(mockDb._whereMock).toHaveBeenCalled();
            expect(result).not.toContainEqual(expiredTenant);
        });

        it('includes tenants with expirationDate = null even when hide_expired = true', async () => {
            const rows = [activeTenant, expiredTenant, nullExpiryTenant];
            const mockDb = await createService(true, rows);

            const result = await service.findAll();

            expect(result).toContainEqual(nullExpiryTenant);
        });
    });

    (hasDatabaseUrl ? it : it.skip)('DB: hidden expired tenant when setting is true', async () => {
        const { db } = await import('../database/database');
        const { tenants } = await import('../database/schema');
        const { SettingsService: RealSettingsService } = await import('../settings/settings.service');

        const realSettings = new RealSettingsService(db);
        await realSettings.loadSettings();

        // force hide_expired = true for this test
        (realSettings as any).cache.set('tenant.hide_expired', 'true');

        const realService = new TenantsService(db, realSettings);

        // Insert an inactive tenant with past expiration
        const [expired] = await db.insert(tenants).values({
            firstName: 'Expired',
            lastName: 'Test',
            status: 'inactive',
            expirationDate: yesterday,
        }).returning();

        try {
            const result = await realService.findAll();
            const ids = result.map((t: any) => t.id);
            expect(ids).not.toContain(expired.id);
        } finally {
            await db.delete(tenants).where(require('drizzle-orm').eq(tenants.id, expired.id));
        }
    });

    (hasDatabaseUrl ? it : it.skip)('DB: visible future-expiry tenant when setting is true', async () => {
        const { db } = await import('../database/database');
        const { tenants } = await import('../database/schema');
        const { SettingsService: RealSettingsService } = await import('../settings/settings.service');

        const realSettings = new RealSettingsService(db);
        await realSettings.loadSettings();

        (realSettings as any).cache.set('tenant.hide_expired', 'true');

        const realService = new TenantsService(db, realSettings);

        const [future] = await db.insert(tenants).values({
            firstName: 'Future',
            lastName: 'Test',
            status: 'inactive',
            expirationDate: tomorrow,
        }).returning();

        try {
            const result = await realService.findAll();
            const ids = result.map((t: any) => t.id);
            expect(ids).toContain(future.id);
        } finally {
            await db.delete(tenants).where(require('drizzle-orm').eq(tenants.id, future.id));
        }
    });
});
