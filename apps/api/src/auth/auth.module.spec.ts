import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DB_TOKEN } from '../database/database.module';

const mockDb = { select: jest.fn() };

describe('AuthModule', () => {
    it('should compile the module', async () => {
        const module = await Test.createTestingModule({
            imports: [JwtModule.register({ secret: 'test', signOptions: { expiresIn: '1h' } })],
            controllers: [AuthController],
            providers: [AuthService, { provide: DB_TOKEN, useValue: mockDb }],
        }).compile();

        expect(module).toBeDefined();
    });

    it('should export JwtService so guards can use it', async () => {
        const module = await Test.createTestingModule({
            imports: [JwtModule.register({ secret: 'test', signOptions: { expiresIn: '1h' } })],
            controllers: [AuthController],
            providers: [AuthService, { provide: DB_TOKEN, useValue: mockDb }],
        }).compile();

        const jwtService = module.get(JwtService);
        expect(jwtService).toBeDefined();
    });
});
