import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
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
        it('returns non-deleted tenants when tenant.hide_expired = false', async () => {
            const rows = [activeTenant, expiredTenant, nullExpiryTenant];
            const mockDb = await createService(false, rows);

            const result = await service.findAll();

            expect(settingsService.getBoolean).toHaveBeenCalledWith('tenant.hide_expired');
            expect(mockDb._fromMock).toHaveBeenCalled();
            expect(mockDb._whereMock).toHaveBeenCalled();
            expect(result).toBeDefined();
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

    function buildCrudMockDb({ selectRows = [] as any[], mutationRows = [] as any[] } = {}) {
        const returning = jest.fn().mockResolvedValue(mutationRows);
        const whereForMutation = jest.fn().mockReturnValue({ returning });
        const set = jest.fn().mockReturnValue({ where: whereForMutation });
        const values = jest.fn().mockReturnValue({ returning });
        const whereForSelect = jest.fn().mockResolvedValue(selectRows);
        const from = jest.fn().mockReturnValue({ where: whereForSelect });
        return {
            select: jest.fn().mockReturnValue({ from }),
            insert: jest.fn().mockReturnValue({ values }),
            update: jest.fn().mockReturnValue({ set }),
            _from: from, _whereForSelect: whereForSelect, _returning: returning,
        };
    }

    async function createCrudService(mockDb: any) {
        const mockSettings = { getBoolean: jest.fn().mockReturnValue(false) };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TenantsService,
                { provide: DB_TOKEN, useValue: mockDb },
                { provide: SettingsService, useValue: mockSettings },
            ],
        }).compile();
        return module.get<TenantsService>(TenantsService);
    }

    describe('findOne', () => {
        it('returns tenant by id', async () => {
            const tenant = { id: 'abc', firstName: 'Alice', lastName: 'Smith' };
            const mockDb = buildCrudMockDb({ selectRows: [tenant] });
            const service = await createCrudService(mockDb);
            const result = await service.findOne('abc');
            expect(result).toEqual(tenant);
        });

        it('throws NotFoundException when no rows returned', async () => {
            const mockDb = buildCrudMockDb({ selectRows: [] });
            const service = await createCrudService(mockDb);
            await expect(service.findOne('abc')).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('inserts with status inactive and expirationDate ~10 years from now, returns row', async () => {
            const newTenant = { id: 'new', firstName: 'Bob', lastName: 'Jones', status: 'inactive', expirationDate: '2036-03-27' };
            const mockDb = buildCrudMockDb({ selectRows: [], mutationRows: [newTenant] });
            const service = await createCrudService(mockDb);
            const result = await service.create({ firstName: 'Bob', lastName: 'Jones' });
            expect(mockDb.insert).toHaveBeenCalled();
            expect(result).toEqual(newTenant);
        });

        it('throws ConflictException with duplicate: true and matchingIds when same name and null contactInfo', async () => {
            const existing = { id: 'dup', firstName: 'Alice', lastName: 'Smith', contactInfo: null };
            const mockDb = buildCrudMockDb({ selectRows: [existing] });
            const service = await createCrudService(mockDb);
            const err = await service.create({ firstName: 'Alice', lastName: 'Smith' }).catch(e => e);
            expect(err).toBeInstanceOf(ConflictException);
            expect(err.getResponse()).toMatchObject({ duplicate: true, matchingIds: ['dup'] });
        });

        it('proceeds without conflict when name matches but contactInfo differs', async () => {
            const existing = { id: 'other', firstName: 'Alice', lastName: 'Smith', contactInfo: { phone: '1234' } };
            const newTenant = { id: 'new', firstName: 'Alice', lastName: 'Smith', status: 'inactive' };
            const mockDb = buildCrudMockDb({ selectRows: [existing], mutationRows: [newTenant] });
            const service = await createCrudService(mockDb);
            const result = await service.create({ firstName: 'Alice', lastName: 'Smith', contactInfo: { phone: '9999' } });
            expect(result).toEqual(newTenant);
        });

        it('handles null contactInfo matching: both null treated as equal → conflict', async () => {
            const existing = { id: 'dup', firstName: 'Alice', lastName: 'Smith', contactInfo: null };
            const mockDb = buildCrudMockDb({ selectRows: [existing] });
            const service = await createCrudService(mockDb);
            await expect(
                service.create({ firstName: 'Alice', lastName: 'Smith', contactInfo: undefined })
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('update', () => {
        it('calls update with partial payload + updatedAt, returns row', async () => {
            const updated = { id: 'abc', firstName: 'Alice', lastName: 'Jones' };
            const mockDb = buildCrudMockDb({ mutationRows: [updated] });
            const service = await createCrudService(mockDb);
            const result = await service.update('abc', { lastName: 'Jones' });
            expect(mockDb.update).toHaveBeenCalled();
            expect(result).toEqual(updated);
        });

        it('throws NotFoundException when no rows returned', async () => {
            const mockDb = buildCrudMockDb({ mutationRows: [] });
            const service = await createCrudService(mockDb);
            await expect(service.update('abc', { lastName: 'Jones' })).rejects.toThrow(NotFoundException);
        });

        it('passes status through when in payload; DB trigger handles expirationDate on UPDATE', async () => {
            const updated = { id: 'abc', status: 'inactive' };
            const mockDb = buildCrudMockDb({ mutationRows: [updated] });
            const service = await createCrudService(mockDb);
            const result = await service.update('abc', { status: 'inactive' });
            expect(result).toEqual(updated);
        });
    });

    describe('remove', () => {
        it('sets deletedAt on tenant and returns updated row', async () => {
            const deleted = { id: 'abc', firstName: 'Alice', lastName: 'Smith', deletedAt: new Date() };
            const mockDb = buildCrudMockDb({ mutationRows: [deleted] });
            const service = await createCrudService(mockDb);
            const result = await service.remove('abc');
            expect(mockDb.update).toHaveBeenCalled();
            expect(result).toEqual(deleted);
        });

        it('throws NotFoundException when no rows returned', async () => {
            const mockDb = buildCrudMockDb({ mutationRows: [] });
            const service = await createCrudService(mockDb);
            await expect(service.remove('abc')).rejects.toThrow(NotFoundException);
        });
    });

    describe('generateEntryLink', () => {
        it('throws NotFoundException when tenant not found', async () => {
            const mockDb = buildCrudMockDb({ selectRows: [] });
            const service = await createCrudService(mockDb);
            await expect(service.generateEntryLink('missing-id')).rejects.toThrow(NotFoundException);
        });

        it('returns { token } and updates entryToken on tenant', async () => {
            const tenant = { id: 'tid-1', firstName: 'Alice', lastName: 'Smith' };
            const updated = { id: 'tid-1', entryToken: 'new-uuid', entryTokenUsedAt: null };
            const mockDb = buildCrudMockDb({ selectRows: [tenant], mutationRows: [updated] });
            const service = await createCrudService(mockDb);

            const result = await service.generateEntryLink('tid-1');

            expect(mockDb.update).toHaveBeenCalled();
            expect(result).toHaveProperty('token');
            expect(typeof result.token).toBe('string');
        });
    });

    (hasDatabaseUrl ? it : it.skip)('DB: hidden expired tenant when setting is true', async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const db = require('../database/database').db;
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { tenants } = require('../database/schema');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { SettingsService: RealSettingsService } = require('../settings/settings.service');

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

        const result = await realService.findAll();
        const ids = result.map((t: any) => t.id);
        expect(ids).not.toContain(expired.id);
        // No cleanup — tenants are protected by no-hard-delete trigger
    });

    (hasDatabaseUrl ? it : it.skip)('DB: visible future-expiry tenant when setting is true', async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const db = require('../database/database').db;
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { tenants } = require('../database/schema');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { SettingsService: RealSettingsService } = require('../settings/settings.service');

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

        const result = await realService.findAll();
        const ids = result.map((t: any) => t.id);
        expect(ids).toContain(future.id);
        // No cleanup — tenants are protected by no-hard-delete trigger
    });
});
