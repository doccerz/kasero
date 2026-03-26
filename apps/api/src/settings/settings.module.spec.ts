import { Test } from '@nestjs/testing';
import { SettingsModule } from './settings.module';

describe('SettingsModule', () => {
    it('should compile the module', async () => {
        const module = await Test.createTestingModule({
            imports: [SettingsModule],
        }).compile();

        expect(module).toBeDefined();
    });
});
