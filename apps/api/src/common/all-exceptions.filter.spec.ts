import { AllExceptionsFilter } from './all-exceptions.filter';
import { ArgumentsHost, HttpException, Logger } from '@nestjs/common';

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
