import { Test } from '@nestjs/testing';
import { LedgersModule } from './ledgers.module';
import { DatabaseModule, DB_TOKEN } from '../database/database.module';

const mockDb = { select: jest.fn() };

describe('LedgersModule', () => {
    it('should compile the module', async () => {
        const module = await Test.createTestingModule({
            imports: [DatabaseModule, LedgersModule],
        })
            .overrideProvider(DB_TOKEN)
            .useValue(mockDb)
            .compile();

        expect(module).toBeDefined();
    });
});
