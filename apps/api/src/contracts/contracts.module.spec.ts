import { Test } from '@nestjs/testing';
import { ContractsModule } from './contracts.module';
import { DatabaseModule, DB_TOKEN } from '../database/database.module';

const mockDb = { select: jest.fn() };

describe('ContractsModule', () => {
    it('should compile the module', async () => {
        const module = await Test.createTestingModule({
            imports: [DatabaseModule, ContractsModule],
        })
            .overrideProvider(DB_TOKEN)
            .useValue(mockDb)
            .compile();

        expect(module).toBeDefined();
    });
});
