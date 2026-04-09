import { AllExceptionsFilter } from './all-exceptions.filter';
import { ArgumentsHost, ConflictException, HttpException, Logger } from '@nestjs/common';

function buildMockHost(statusCode = 200): ArgumentsHost {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const getResponse = jest.fn().mockReturnValue({ status });
    const getRequest = jest.fn().mockReturnValue({ url: '/test', method: 'GET' });
    return {
        switchToHttp: jest.fn().mockReturnValue({ getResponse, getRequest }),
    } as unknown as ArgumentsHost;
}

describe('AllExceptionsFilter', () => {
    let filter: AllExceptionsFilter;
    let loggerErrorSpy: jest.SpyInstance;
    let loggerWarnSpy: jest.SpyInstance;

    beforeEach(() => {
        filter = new AllExceptionsFilter();
        loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
        loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('logs 4xx HttpExceptions with warn', () => {
        const host = buildMockHost();
        const exception = new HttpException('Bad request', 400);

        filter.catch(exception, host);

        expect(loggerWarnSpy).toHaveBeenCalled();
        expect(loggerErrorSpy).not.toHaveBeenCalled();
    });

    it('logs 5xx HttpExceptions with error', () => {
        const host = buildMockHost();
        const exception = new HttpException('Internal error', 500);

        filter.catch(exception, host);

        expect(loggerErrorSpy).toHaveBeenCalled();
        expect(loggerWarnSpy).not.toHaveBeenCalled();
    });

    it('logs non-HttpExceptions (unknown errors) with error', () => {
        const host = buildMockHost();
        const exception = new Error('Something crashed');

        filter.catch(exception, host);

        expect(loggerErrorSpy).toHaveBeenCalled();
        expect(loggerWarnSpy).not.toHaveBeenCalled();
    });

    it('returns standard error shape with status 500 for unknown errors', () => {
        const host = buildMockHost();
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        (host.switchToHttp as jest.Mock).mockReturnValue({
            getResponse: () => ({ status }),
            getRequest: () => ({ url: '/test', method: 'GET' }),
        });
        const exception = new Error('crash');

        filter.catch(exception, host);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 500 }),
        );
    });

    describe('useful error details', () => {
        const originalEnv = process.env.NODE_ENV;
        afterEach(() => {
            process.env.NODE_ENV = originalEnv;
        });

        function captureJson(host: ArgumentsHost) {
            const json = jest.fn();
            const status = jest.fn().mockReturnValue({ json });
            (host.switchToHttp as jest.Mock).mockReturnValue({
                getResponse: () => ({ status }),
                getRequest: () => ({ url: '/admin/tenants', method: 'POST' }),
            });
            return { json, status };
        }

        it('surfaces Postgres error fields on 500 in non-production', () => {
            process.env.NODE_ENV = 'development';
            const host = buildMockHost();
            const { json } = captureJson(host);
            const pgError = Object.assign(
                new Error('column "deleted_at" does not exist'),
                { code: '42703', table: 'tenants', column: 'deleted_at' },
            );

            filter.catch(pgError, host);

            expect(json).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 500,
                    message: 'column "deleted_at" does not exist',
                    error: expect.objectContaining({
                        code: '42703',
                        table: 'tenants',
                        column: 'deleted_at',
                    }),
                }),
            );
        });

        it('hides internal error details on 500 in production', () => {
            process.env.NODE_ENV = 'production';
            const host = buildMockHost();
            const { json } = captureJson(host);
            const pgError = Object.assign(new Error('secret db detail'), { code: '42703' });

            filter.catch(pgError, host);

            const body = (json as jest.Mock).mock.calls[0][0];
            expect(body.statusCode).toBe(500);
            expect(body.message).toBe('Internal server error');
            expect(body.error).toBeUndefined();
            expect(JSON.stringify(body)).not.toContain('secret db detail');
        });

        it('preserves structured ConflictException payloads in the response body', () => {
            process.env.NODE_ENV = 'development';
            const host = buildMockHost();
            const { json } = captureJson(host);
            const exception = new ConflictException({
                duplicate: true,
                matchingIds: ['tenant-1', 'tenant-2'],
            });

            filter.catch(exception, host);

            expect(json).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 409,
                    message: expect.objectContaining({
                        duplicate: true,
                        matchingIds: ['tenant-1', 'tenant-2'],
                    }),
                }),
            );
        });
    });

    it('returns standard error shape with correct status for HttpException', () => {
        const host = buildMockHost();
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        (host.switchToHttp as jest.Mock).mockReturnValue({
            getResponse: () => ({ status }),
            getRequest: () => ({ url: '/test', method: 'GET' }),
        });
        const exception = new HttpException('Not found', 404);

        filter.catch(exception, host);

        expect(status).toHaveBeenCalledWith(404);
        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 404 }),
        );
    });
});
