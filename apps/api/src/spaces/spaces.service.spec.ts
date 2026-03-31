import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { DB_TOKEN } from '../database/database.module';

const hasDatabaseUrl = !!process.env.DATABASE_URL;

function buildMockDb({ selectRows = [] as any[], mutationRows = [] as any[] } = {}) {
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
        _from: from,
        _whereForSelect: whereForSelect,
        _returning: returning,
    };
}

describe('SpacesService', () => {
    async function createService(mockDb: ReturnType<typeof buildMockDb>) {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SpacesService,
                { provide: DB_TOKEN, useValue: mockDb },
            ],
        }).compile();
        return module.get<SpacesService>(SpacesService);
    }

    describe('findAll', () => {
        it('returns only non-deleted spaces', async () => {
            const rows = [{ id: '1', name: 'Space A', deletedAt: null }];
            const mockDb = buildMockDb({ selectRows: rows });
            const service = await createService(mockDb);

            const result = await service.findAll();

            expect(mockDb.select).toHaveBeenCalled();
            expect(mockDb._from).toHaveBeenCalled();
            expect(mockDb._whereForSelect).toHaveBeenCalled();
            expect(result).toEqual(rows);
        });

        it('returns empty array when all spaces are deleted', async () => {
            const mockDb = buildMockDb({ selectRows: [] });
            const service = await createService(mockDb);

            const result = await service.findAll();

            expect(result).toEqual([]);
        });
    });

    describe('findOne', () => {
        it('returns space by id when not deleted', async () => {
            const space = { id: 'abc', name: 'Space A', deletedAt: null };
            const mockDb = buildMockDb({ selectRows: [space] });
            const service = await createService(mockDb);

            const result = await service.findOne('abc');

            expect(result).toEqual(space);
        });

        it('throws NotFoundException when no row found', async () => {
            const mockDb = buildMockDb({ selectRows: [] });
            const service = await createService(mockDb);

            await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
        });

        it('throws NotFoundException when space is soft-deleted', async () => {
            // When soft-deleted the WHERE clause (isNull guard) returns no rows
            const mockDb = buildMockDb({ selectRows: [] });
            const service = await createService(mockDb);

            await expect(service.findOne('deleted-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('inserts and returns the created row', async () => {
            const created = { id: 'new', name: 'Space B', deletedAt: null };
            const mockDb = buildMockDb({ mutationRows: [created] });
            const service = await createService(mockDb);

            const result = await service.create({ name: 'Space B' });

            expect(mockDb.insert).toHaveBeenCalled();
            expect(result).toEqual(created);
        });
    });

    describe('update', () => {
        it('updates partial data and returns updated row', async () => {
            const updated = { id: '1', name: 'Renamed', deletedAt: null };
            const mockDb = buildMockDb({ mutationRows: [updated] });
            const service = await createService(mockDb);

            const result = await service.update('1', { name: 'Renamed' });

            expect(mockDb.update).toHaveBeenCalled();
            expect(result).toEqual(updated);
        });

        it('throws NotFoundException when no rows returned', async () => {
            const mockDb = buildMockDb({ mutationRows: [] });
            const service = await createService(mockDb);

            await expect(service.update('missing', { name: 'X' })).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('sets deletedAt = now() and returns the soft-deleted row', async () => {
            const softDeleted = { id: '1', name: 'Space A', deletedAt: new Date() };
            const mockDb = buildMockDb({ mutationRows: [softDeleted] });
            const service = await createService(mockDb);

            const result = await service.remove('1');

            expect(mockDb.update).toHaveBeenCalled();
            expect(result).toEqual(softDeleted);
        });

        it('throws NotFoundException when no rows returned', async () => {
            const mockDb = buildMockDb({ mutationRows: [] });
            const service = await createService(mockDb);

            await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
        });
    });

    (hasDatabaseUrl ? describe : describe.skip)('DB integration', () => {
        it('insert space → findAll returns it; remove it → findAll no longer returns it', async () => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const db = require('../database/database').db;
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { spaces } = require('../database/schema');
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { eq } = require('drizzle-orm');

            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { SettingsService } = require('../settings/settings.service');
            const settingsSvc = new SettingsService(db);
            const service = new SpacesService(db as any);

            const [inserted] = await db.insert(spaces).values({ name: 'Integration Test Space' }).returning();

            try {
                const allBefore = await service.findAll();
                expect(allBefore.map((s: any) => s.id)).toContain(inserted.id);

                await service.remove(inserted.id);

                const allAfter = await service.findAll();
                expect(allAfter.map((s: any) => s.id)).not.toContain(inserted.id);
            } finally {
                // Hard-delete cleanup (spaces allow hard delete in tests)
                await db.delete(spaces).where(eq(spaces.id, inserted.id)).catch(() => {});
            }
        });
    });
});
