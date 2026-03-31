import { Test } from '@nestjs/testing';
import { TenantsModule } from './tenants.module';
import { DatabaseModule, DB_TOKEN } from '../database/database.module';

const mockDb = { select: jest.fn() };

describe('TenantsModule', () => {
    it('should compile the module', async () => {
        const module = await Test.createTestingModule({
            imports: [DatabaseModule, TenantsModule],
        })
            .overrideProvider(DB_TOKEN)
            .useValue(mockDb)
            .compile();

        expect(module).toBeDefined();
    });
});
