import { Test } from '@nestjs/testing';
import { AuditModule } from './audit.module';

describe('AuditModule', () => {
    it('should compile the module', async () => {
        const module = await Test.createTestingModule({
            imports: [AuditModule],
        }).compile();

        expect(module).toBeDefined();
    });
});
