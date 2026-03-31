import { Test } from '@nestjs/testing';
import { PublicAccessModule } from './public-access.module';
import { DatabaseModule, DB_TOKEN } from '../database/database.module';

const mockDb = { select: jest.fn(), update: jest.fn() };

describe('PublicAccessModule', () => {
    it('should compile the module', async () => {
        const module = await Test.createTestingModule({
            imports: [DatabaseModule, PublicAccessModule],
        })
            .overrideProvider(DB_TOKEN)
            .useValue(mockDb)
            .compile();

        expect(module).toBeDefined();
    });
});
