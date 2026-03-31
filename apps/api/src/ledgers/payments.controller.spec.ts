import { Controller, Post, UseGuards, HttpCode, NotFoundException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { PaymentsController } from './payments.controller';
import { LedgersService } from './ledgers.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/payments/:id')
class TestPaymentsController {
    @Post('void')
    @HttpCode(200)
    void() {
        return {};
    }
}

describe('PaymentsController — guard integration', () => {
    let app: INestApplication;

    const mockJwtService = { verify: jest.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TestPaymentsController],
            providers: [{ provide: JwtService, useValue: mockJwtService }],
        }).compile();

        app = module.createNestApplication();
        await app.init();
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await app.close();
    });

    it('POST /admin/payments/:id/void without token → 401', async () => {
        await request(app.getHttpServer()).post('/admin/payments/pm-uuid/void').expect(401);
    });

    it('POST /admin/payments/:id/void with valid token → not 401', async () => {
        mockJwtService.verify.mockReturnValue({ sub: 'uuid-1', username: 'admin' });

        const res = await request(app.getHttpServer())
            .post('/admin/payments/pm-uuid/void')
            .set('Authorization', 'Bearer validtoken');

        expect(res.status).not.toBe(401);
    });
});

describe('PaymentsController — endpoints', () => {
    let app: INestApplication;

    const mockLedgersService = {
        voidPayment: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PaymentsController],
            providers: [{ provide: LedgersService, useValue: mockLedgersService }],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        app = module.createNestApplication();
        await app.init();
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await app.close();
    });

    it('POST /admin/payments/:id/void → 200 with voided payment', async () => {
        const voided = { id: 'pm-uuid', contractId: 'c-uuid', amount: '500.00', voidedAt: new Date().toISOString() };
        mockLedgersService.voidPayment.mockResolvedValue(voided);

        const res = await request(app.getHttpServer()).post('/admin/payments/pm-uuid/void');

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id: 'pm-uuid' });
        expect(mockLedgersService.voidPayment).toHaveBeenCalledWith('pm-uuid');
    });

    it('POST /admin/payments/:id/void when NotFoundException → 404', async () => {
        mockLedgersService.voidPayment.mockRejectedValue(new NotFoundException('Payment not found'));

        const res = await request(app.getHttpServer()).post('/admin/payments/nonexistent/void');

        expect(res.status).toBe(404);
    });

    it('POST /admin/payments/:id/void when BadRequestException → 400', async () => {
        mockLedgersService.voidPayment.mockRejectedValue(new BadRequestException('Payment already voided'));

        const res = await request(app.getHttpServer()).post('/admin/payments/pm-uuid/void');

        expect(res.status).toBe(400);
    });
});
