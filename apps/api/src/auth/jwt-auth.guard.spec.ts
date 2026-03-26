import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;

    const mockJwtService = {
        verify: jest.fn(),
    };

    const makeContext = (authHeader?: string) => {
        const request: any = { headers: authHeader ? { authorization: authHeader } : {} };
        return {
            switchToHttp: () => ({
                getRequest: () => request,
            }),
            request,
        };
    };

    beforeEach(() => {
        guard = new JwtAuthGuard(mockJwtService as unknown as JwtService);
        jest.clearAllMocks();
    });

    it('should throw UnauthorizedException when no Authorization header', () => {
        const ctx = makeContext();
        expect(() => guard.canActivate(ctx as any)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when Authorization does not start with Bearer', () => {
        const ctx = makeContext('Basic sometoken');
        expect(() => guard.canActivate(ctx as any)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is invalid or expired', () => {
        mockJwtService.verify.mockImplementation(() => {
            throw new Error('invalid token');
        });
        const ctx = makeContext('Bearer invalidtoken');
        expect(() => guard.canActivate(ctx as any)).toThrow(UnauthorizedException);
    });

    it('should return true and attach payload to request.user when token is valid', () => {
        const payload = { sub: 'uuid-1', username: 'admin' };
        mockJwtService.verify.mockReturnValue(payload);
        const ctx = makeContext('Bearer validtoken');
        const result = guard.canActivate(ctx as any);
        expect(result).toBe(true);
        expect(ctx.request.user).toEqual(payload);
    });
});
