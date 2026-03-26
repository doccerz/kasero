import { Test } from '@nestjs/testing';
import { ContractsModule } from './contracts.module';

describe('ContractsModule', () => {
    it('should compile the module', async () => {
        const module = await Test.createTestingModule({
            imports: [ContractsModule],
        }).compile();

        expect(module).toBeDefined();
    });
});
