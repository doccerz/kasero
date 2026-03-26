import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from './auth.module';

describe('AuthModule', () => {
    it('should compile the module', async () => {
        const module = await Test.createTestingModule({
            imports: [AuthModule],
        }).compile();

        expect(module).toBeDefined();
    });

    it('should export JwtService so guards can use it', async () => {
        const module = await Test.createTestingModule({
            imports: [AuthModule],
        }).compile();

        const jwtService = module.get(JwtService);
        expect(jwtService).toBeDefined();
    });
});
