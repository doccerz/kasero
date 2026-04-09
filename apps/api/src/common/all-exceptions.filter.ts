import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

// Fields we pluck from a node-postgres error (pg.DatabaseError) to give
// developers actionable context when a query blows up. See
// https://www.postgresql.org/docs/current/protocol-error-fields.html
const PG_ERROR_FIELDS = ['code', 'detail', 'hint', 'table', 'column', 'constraint', 'schema', 'routine'] as const;

function extractPgErrorDetails(err: unknown): Record<string, unknown> | undefined {
    if (!err || typeof err !== 'object') return undefined;
    const out: Record<string, unknown> = {};
    for (const field of PG_ERROR_FIELDS) {
        const value = (err as Record<string, unknown>)[field];
        if (value !== undefined && value !== null) out[field] = value;
    }
    return Object.keys(out).length > 0 ? out : undefined;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const isProd = process.env.NODE_ENV === 'production';

        let status: number;
        let message: unknown;
        let errorDetails: Record<string, unknown> | undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            // getResponse() returns either a string or the object the thrower
            // passed in — preserve the object so clients can read structured
            // payloads like ConflictException({ duplicate, matchingIds }).
            const resBody = exception.getResponse();
            if (typeof resBody === 'string') {
                message = resBody;
            } else if (resBody && typeof resBody === 'object' && 'message' in resBody) {
                message = (resBody as { message: unknown }).message;
            } else {
                message = resBody;
            }
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            if (isProd) {
                message = 'Internal server error';
            } else {
                message = exception instanceof Error ? exception.message : String(exception);
                errorDetails = extractPgErrorDetails(exception);
                if (exception instanceof Error && exception.name && exception.name !== 'Error') {
                    errorDetails = { ...(errorDetails ?? {}), name: exception.name };
                }
            }
        }

        if (status >= 500) {
            // Always log the full stack + pg fields to stdout regardless of env
            // so operators can diagnose prod incidents from logs.
            const pgFields = extractPgErrorDetails(exception);
            const context = [
                `${request.method} ${request.url} → ${status}`,
                pgFields ? `pg=${JSON.stringify(pgFields)}` : '',
            ].filter(Boolean).join(' ');
            this.logger.error(
                context,
                exception instanceof Error ? exception.stack : String(exception),
            );
        } else {
            this.logger.warn(`${request.method} ${request.url} → ${status}: ${typeof message === 'string' ? message : JSON.stringify(message)}`);
        }

        const body: Record<string, unknown> = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message,
        };
        if (errorDetails) body.error = errorDetails;

        response.status(status).json(body);
    }
}
