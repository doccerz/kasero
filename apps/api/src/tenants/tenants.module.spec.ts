import { Test } from '@nestjs/testing';
import { TenantsModule } from './tenants.module';

describe('TenantsModule', () => {
    it('should compile the module', async () => {
        const module = await Test.createTestingModule({
            imports: [TenantsModule],
        }).compile();

        expect(module).toBeDefined();
    });
});
