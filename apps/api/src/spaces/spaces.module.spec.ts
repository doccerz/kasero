import { Test } from '@nestjs/testing';
import { SpacesModule } from './spaces.module';
import { DatabaseModule, DB_TOKEN } from '../database/database.module';

const mockDb = { select: jest.fn() };

describe('SpacesModule', () => {
    it('should compile the module', async () => {
        const module = await Test.createTestingModule({
            imports: [DatabaseModule, SpacesModule],
        })
            .overrideProvider(DB_TOKEN)
            .useValue(mockDb)
            .compile();

        expect(module).toBeDefined();
    });
});
