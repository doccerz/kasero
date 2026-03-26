import { Test } from '@nestjs/testing';
import { PublicAccessModule } from './public-access.module';

describe('PublicAccessModule', () => {
    it('should compile the module', async () => {
        const module = await Test.createTestingModule({
            imports: [PublicAccessModule],
        }).compile();

        expect(module).toBeDefined();
    });
});
