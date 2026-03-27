import { Controller, Get, UseGuards, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ContractLedgerController } from './ledgers.controller';
import { LedgersService } from './ledgers.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/contracts/:id')
class TestLedgerController {
    @Get('ledger')
    getLedger() {
        return {};
    }
}

describe('ContractLedgerController — guard integration', () => {
    let app: INestApplication;

    const mockJwtService = { verify: jest.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TestLedgerController],
            providers: [{ provide: JwtService, useValue: mockJwtService }],
        }).compile();

        app = module.createNestApplication();
        await app.init();
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await app.close();
    });

    it('GET /admin/contracts/:id/ledger without token → 401', async () => {
        await request(app.getHttpServer()).get('/admin/contracts/some-id/ledger').expect(401);
    });

    it('GET /admin/contracts/:id/ledger with valid token → not 401', async () => {
        mockJwtService.verify.mockReturnValue({ sub: 'uuid-1', username: 'admin' });

        const res = await request(app.getHttpServer())
            .get('/admin/contracts/some-id/ledger')
            .set('Authorization', 'Bearer validtoken');

        expect(res.status).not.toBe(401);
    });
});

describe('ContractLedgerController — endpoints', () => {
    let app: INestApplication;

    const mockLedgersService = {
        getLedger: jest.fn(),
        recordPayment: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ContractLedgerController],
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

    it('GET /admin/contracts/:id/ledger → 200 with ledger view', async () => {
        const ledger = {
            payables: [{ id: 'p1', amount: '1000.00' }],
            payments: [],
            fund: [],
            amount_due: '1000.00',
        };
        mockLedgersService.getLedger.mockResolvedValue(ledger);

        const res = await request(app.getHttpServer()).get('/admin/contracts/contract-uuid/ledger');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(ledger);
        expect(mockLedgersService.getLedger).toHaveBeenCalledWith('contract-uuid', undefined);
    });

    it('GET /admin/contracts/:id/ledger with referenceDate query → passes it to service', async () => {
        const ledger = { payables: [], payments: [], fund: [], amount_due: '0.00' };
        mockLedgersService.getLedger.mockResolvedValue(ledger);

        const res = await request(app.getHttpServer())
            .get('/admin/contracts/contract-uuid/ledger?referenceDate=2024-03-15');

        expect(res.status).toBe(200);
        expect(mockLedgersService.getLedger).toHaveBeenCalledWith('contract-uuid', '2024-03-15');
    });

    it('POST /admin/contracts/:id/payments → 201 with new payment', async () => {
        const payment = { id: 'pm-new', contractId: 'contract-uuid', amount: '500.00', date: '2024-06-01' };
        mockLedgersService.recordPayment.mockResolvedValue(payment);

        const res = await request(app.getHttpServer())
            .post('/admin/contracts/contract-uuid/payments')
            .send({ amount: '500.00', date: '2024-06-01' });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(payment);
        expect(mockLedgersService.recordPayment).toHaveBeenCalledWith('contract-uuid', { amount: '500.00', date: '2024-06-01' });
    });

    it('POST /admin/contracts/:id/payments without date → 201', async () => {
        const payment = { id: 'pm-new', contractId: 'contract-uuid', amount: '500.00' };
        mockLedgersService.recordPayment.mockResolvedValue(payment);

        const res = await request(app.getHttpServer())
            .post('/admin/contracts/contract-uuid/payments')
            .send({ amount: '500.00' });

        expect(res.status).toBe(201);
    });
});
