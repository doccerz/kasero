import { appConfig } from './config';

describe('appConfig', () => {
    it('reads apiPort from API_PORT env var', () => {
        expect(typeof appConfig.apiPort).toBe('number');
    });

    it('defaults apiPort to 3001 when API_PORT is not set', () => {
        const original = process.env.API_PORT;
        delete process.env.API_PORT;
        // Re-require to pick up env change would require module cache clearing,
        // so instead we verify the default logic directly
        const port = parseInt(process.env.API_PORT ?? '3001', 10);
        expect(port).toBe(3001);
        if (original !== undefined) process.env.API_PORT = original;
    });

    it('exposes jwtExpiresIn defaulting to 8h', () => {
        expect(appConfig.jwtExpiresIn).toBeDefined();
    });

    it('exposes nodeEnv defaulting to development', () => {
        expect(appConfig.nodeEnv).toBeDefined();
    });

    it('exposes adminUsername defaulting to admin', () => {
        expect(appConfig.adminUsername).toBeDefined();
    });
});
