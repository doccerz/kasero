import { Test } from '@nestjs/testing';
import { SettingsModule } from './settings.module';
import { SettingsService } from './settings.service';
import { DatabaseModule, DB_TOKEN } from '../database/database.module';

const mockDb = { select: jest.fn() };

describe('SettingsModule', () => {
    it('should compile the module', async () => {
        const module = await Test.createTestingModule({
            imports: [DatabaseModule, SettingsModule],
        })
            .overrideProvider(DB_TOKEN)
            .useValue(mockDb)
            .compile();

        expect(module).toBeDefined();
    });

    it('should export SettingsService and make it injectable', async () => {
        const module = await Test.createTestingModule({
            imports: [DatabaseModule, SettingsModule],
        })
            .overrideProvider(DB_TOKEN)
            .useValue(mockDb)
            .compile();

        const service = module.get<SettingsService>(SettingsService);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(SettingsService);
    });
});
