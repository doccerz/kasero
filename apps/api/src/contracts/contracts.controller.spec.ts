import { Controller, Get, UseGuards, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/contracts')
class TestContractsController {
    @Get()
    list() {
        return [];
    }
}

describe('ContractsController — guard integration', () => {
    let app: INestApplication;

    const mockJwtService = {
        verify: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TestContractsController],
            providers: [{ provide: JwtService, useValue: mockJwtService }],
        }).compile();

        app = module.createNestApplication();
        await app.init();
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await app.close();
    });

    it('GET /admin/contracts without token → 401', async () => {
        await request(app.getHttpServer()).get('/admin/contracts').expect(401);
    });

    it('GET /admin/contracts with valid token → not 401', async () => {
        mockJwtService.verify.mockReturnValue({ sub: 'uuid-1', username: 'admin' });

        const res = await request(app.getHttpServer())
            .get('/admin/contracts')
            .set('Authorization', 'Bearer validtoken');

        expect(res.status).not.toBe(401);
    });
});

describe('ContractsController — endpoints', () => {
    let app: INestApplication;

    const mockContractsService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        post: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ContractsController],
            providers: [{ provide: ContractsService, useValue: mockContractsService }],
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

    it('GET /admin/contracts → 200', async () => {
        const contracts = [{ id: 'uuid-1', status: 'draft' }];
        mockContractsService.findAll.mockResolvedValue(contracts);

        const res = await request(app.getHttpServer()).get('/admin/contracts');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(contracts);
    });

    it('GET /admin/contracts/:id → 200', async () => {
        const contract = { id: 'uuid-1', status: 'draft' };
        mockContractsService.findOne.mockResolvedValue(contract);

        const res = await request(app.getHttpServer()).get('/admin/contracts/uuid-1');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(contract);
    });

    it('GET /admin/contracts/:id when NotFoundException → 404', async () => {
        mockContractsService.findOne.mockRejectedValue(new NotFoundException('Contract not found'));

        const res = await request(app.getHttpServer()).get('/admin/contracts/missing');

        expect(res.status).toBe(404);
    });

    it('POST /admin/contracts → 201', async () => {
        const contract = { id: 'uuid-1', status: 'draft' };
        mockContractsService.create.mockResolvedValue(contract);

        const res = await request(app.getHttpServer())
            .post('/admin/contracts')
            .send({ tenantId: 'tenant-1', spaceId: 'space-1', startDate: '2024-01-01', endDate: '2024-12-31', rentAmount: '1000.00', billingFrequency: 'monthly', dueDateRule: 5 });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(contract);
    });

    it('PATCH /admin/contracts/:id → 200', async () => {
        const contract = { id: 'uuid-1', status: 'draft', rentAmount: '1200.00' };
        mockContractsService.update.mockResolvedValue(contract);

        const res = await request(app.getHttpServer())
            .patch('/admin/contracts/uuid-1')
            .send({ rentAmount: '1200.00' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(contract);
    });

    it('PATCH /admin/contracts/:id when BadRequestException → 400', async () => {
        mockContractsService.update.mockRejectedValue(new BadRequestException('Cannot modify a posted contract'));

        const res = await request(app.getHttpServer())
            .patch('/admin/contracts/uuid-1')
            .send({ rentAmount: '1200.00' });

        expect(res.status).toBe(400);
    });

    it('PATCH /admin/contracts/:id when NotFoundException → 404', async () => {
        mockContractsService.update.mockRejectedValue(new NotFoundException('Contract not found'));

        const res = await request(app.getHttpServer())
            .patch('/admin/contracts/missing')
            .send({ rentAmount: '1200.00' });

        expect(res.status).toBe(404);
    });

    it('POST /admin/contracts/:id/post → 200', async () => {
        const posted = { id: 'uuid-1', status: 'posted' };
        mockContractsService.post.mockResolvedValue(posted);

        const res = await request(app.getHttpServer())
            .post('/admin/contracts/uuid-1/post');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(posted);
    });

    it('POST /admin/contracts/:id/post when ConflictException → 409', async () => {
        mockContractsService.post.mockRejectedValue(new ConflictException('A posted contract already exists for this space'));

        const res = await request(app.getHttpServer())
            .post('/admin/contracts/uuid-1/post');

        expect(res.status).toBe(409);
    });

    it('DELETE /admin/contracts/:id → 404 (route does not exist)', async () => {
        const res = await request(app.getHttpServer()).delete('/admin/contracts/uuid-1');

        expect(res.status).toBe(404);
    });
});
