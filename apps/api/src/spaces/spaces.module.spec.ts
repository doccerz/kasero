import { Test } from '@nestjs/testing';
import { SpacesModule } from './spaces.module';

describe('SpacesModule', () => {
    it('should compile the module', async () => {
        const module = await Test.createTestingModule({
            imports: [SpacesModule],
        }).compile();

        expect(module).toBeDefined();
    });
});
