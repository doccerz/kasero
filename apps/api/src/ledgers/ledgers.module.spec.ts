import { Test } from '@nestjs/testing';
import { LedgersModule } from './ledgers.module';

describe('LedgersModule', () => {
    it('should compile the module', async () => {
        const module = await Test.createTestingModule({
            imports: [LedgersModule],
        }).compile();

        expect(module).toBeDefined();
    });
});
