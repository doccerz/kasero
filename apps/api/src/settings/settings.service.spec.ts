import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { DB_TOKEN } from '../database/database.module';

const hasDatabaseUrl = !!process.env.DATABASE_URL;

const mockDb = {
    select: jest.fn().mockReturnValue({
        from: jest.fn().mockResolvedValue([{ key: 'tenant.hide_expired', value: 'true' }]),
    }),
};

describe('SettingsService', () => {
    let service: SettingsService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SettingsService,
                { provide: DB_TOKEN, useValue: mockDb },
            ],
        }).compile();

        service = module.get<SettingsService>(SettingsService);
    });

    describe('onApplicationBootstrap', () => {
        it('loads all settings rows into in-memory cache', async () => {
            await service.onApplicationBootstrap();
            expect(mockDb.select).toHaveBeenCalled();
        });
    });

    describe('get', () => {
        beforeEach(async () => {
            await service.onApplicationBootstrap();
        });

        it('returns value for known key', () => {
            expect(service.get('tenant.hide_expired')).toBe('true');
        });

        it('returns undefined for unknown key', () => {
            expect(service.get('unknown.key')).toBeUndefined();
        });
    });

    describe('getBoolean', () => {
        beforeEach(async () => {
            await service.onApplicationBootstrap();
        });

        it("returns true when value is 'true'", () => {
            expect(service.getBoolean('tenant.hide_expired')).toBe(true);
        });

        it('returns default value when key is absent', () => {
            expect(service.getBoolean('missing.key', false)).toBe(false);
        });
    });

    (hasDatabaseUrl ? it : it.skip)('DB: settings are populated after bootstrap', async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const db = require('../database/database').db;
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { settings } = require('../database/schema');

        const dbService = new SettingsService(db);
        await dbService.onApplicationBootstrap();

        const rows = await db.select().from(settings);
        expect(rows.length).toBeGreaterThan(0);

        const hideExpired = dbService.get('tenant.hide_expired');
        expect(hideExpired).toBeDefined();
    });
});
