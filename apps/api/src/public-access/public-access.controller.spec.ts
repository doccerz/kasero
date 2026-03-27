import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException, BadRequestException, GoneException } from '@nestjs/common';
import request from 'supertest';
import { PublicAccessController } from './public-access.controller';
import { PublicAccessService } from './public-access.service';

describe('PublicAccessController', () => {
    let app: INestApplication;

    const mockService = {
        getPublicStatus: jest.fn(),
        resolveEntryToken: jest.fn(),
        submitEntry: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PublicAccessController],
            providers: [{ provide: PublicAccessService, useValue: mockService }],
        }).compile();

        app = module.createNestApplication();
        await app.init();
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await app.close();
    });

    describe('GET /internal/contracts/public/:code', () => {
        it('returns 200 with ledger data for valid code', async () => {
            const payload = {
                contractId: 'cid-1',
                ledger: { payables: [], payments: [], fund: [], amount_due: '100.00' },
            };
            mockService.getPublicStatus.mockResolvedValue(payload);

            const res = await request(app.getHttpServer())
                .get('/internal/contracts/public/valid-code');

            expect(res.status).toBe(200);
            expect(res.body).toEqual(payload);
        });

        it('returns 404 when service throws NotFoundException', async () => {
            mockService.getPublicStatus.mockRejectedValue(new NotFoundException('Not found'));

            const res = await request(app.getHttpServer())
                .get('/internal/contracts/public/bad-code');

            expect(res.status).toBe(404);
        });
    });

    describe('GET /internal/tenants/entry/:token', () => {
        it('returns 200 when token is valid and unused', async () => {
            mockService.resolveEntryToken.mockResolvedValue({ tenantId: 'tid-1', usedAt: null });

            const res = await request(app.getHttpServer())
                .get('/internal/tenants/entry/valid-token');

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({ tenantId: 'tid-1' });
        });

        it('returns 410 when token has been used', async () => {
            mockService.resolveEntryToken.mockResolvedValue({
                tenantId: 'tid-1',
                usedAt: new Date('2025-01-01'),
            });

            const res = await request(app.getHttpServer())
                .get('/internal/tenants/entry/used-token');

            expect(res.status).toBe(410);
        });

        it('returns 404 when service throws NotFoundException', async () => {
            mockService.resolveEntryToken.mockRejectedValue(new NotFoundException('Not found'));

            const res = await request(app.getHttpServer())
                .get('/internal/tenants/entry/bad-token');

            expect(res.status).toBe(404);
        });
    });

    describe('POST /internal/tenants/entry/:token', () => {
        it('returns 201 on successful submission', async () => {
            const updated = { id: 'tid-1', firstName: 'Alice', lastName: 'Smith' };
            mockService.submitEntry.mockResolvedValue(updated);

            const res = await request(app.getHttpServer())
                .post('/internal/tenants/entry/valid-token')
                .send({ firstName: 'Alice', lastName: 'Smith', contactInfo: null, consentGiven: true });

            expect(res.status).toBe(201);
            expect(res.body).toEqual(updated);
        });

        it('returns 400 when service throws BadRequestException', async () => {
            mockService.submitEntry.mockRejectedValue(new BadRequestException('Consent required'));

            const res = await request(app.getHttpServer())
                .post('/internal/tenants/entry/token')
                .send({ firstName: 'A', lastName: 'B', contactInfo: null, consentGiven: false });

            expect(res.status).toBe(400);
        });
    });
});
