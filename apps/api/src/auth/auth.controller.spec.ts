import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DB_TOKEN } from '../database/database.module';

describe('AuthController — POST /auth/login', () => {
    let controller: AuthController;
    let authService: AuthService;

    const mockAuthService = {
        login: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: mockAuthService }],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
        jest.clearAllMocks();
    });

    it('should return access_token on valid credentials', async () => {
        const token = { access_token: 'signed.jwt.token' };
        mockAuthService.login.mockResolvedValue(token);

        const result = await controller.login({ username: 'admin', password: 'correctpass' });

        expect(mockAuthService.login).toHaveBeenCalledWith('admin', 'correctpass');
        expect(result).toEqual(token);
    });

    it('should propagate UnauthorizedException on wrong password', async () => {
        mockAuthService.login.mockRejectedValue(new UnauthorizedException());

        await expect(
            controller.login({ username: 'admin', password: 'wrongpass' }),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should propagate UnauthorizedException on unknown username', async () => {
        mockAuthService.login.mockRejectedValue(new UnauthorizedException());

        await expect(
            controller.login({ username: 'unknown', password: 'anypass' }),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });
});

describe('AuthService — login()', () => {
    let authService: AuthService;

    const fakeUser = {
        id: 'uuid-1234',
        username: 'admin',
        // bcrypt hash of 'correctpass'
        passwordHash: '$2b$10$oWW6khl0BKkOU1E787rAxeAiU5IbB5rsP4fItC1lXmT6Pecq4UIke',
    };

    const mockDb = {
        select: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn().mockReturnValue('signed.jwt.token'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: DB_TOKEN, useValue: mockDb },
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        jest.clearAllMocks();
    });

    it('should throw UnauthorizedException when user not found', async () => {
        mockDb.select.mockReturnValue({
            from: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([]),
                }),
            }),
        });

        await expect(authService.login('unknown', 'anypass')).rejects.toBeInstanceOf(
            UnauthorizedException,
        );
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
        mockDb.select.mockReturnValue({
            from: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([fakeUser]),
                }),
            }),
        });

        await expect(authService.login('admin', 'wrongpass')).rejects.toBeInstanceOf(
            UnauthorizedException,
        );
    });

    it('should return access_token on valid credentials', async () => {
        mockDb.select.mockReturnValue({
            from: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([fakeUser]),
                }),
            }),
        });

        // We need a real bcrypt hash for 'correctpass' — skip if bcrypt compare is abstracted
        // This test validates the full flow using a known bcrypt hash
        const result = await authService.login('admin', 'correctpass');
        expect(result).toHaveProperty('access_token');
        expect(typeof result.access_token).toBe('string');
    });
});
