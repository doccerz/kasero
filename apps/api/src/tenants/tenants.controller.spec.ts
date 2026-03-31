import { Controller, Get, UseGuards, NotFoundException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/tenants')
class TestTenantsController {
    @Get()
    list() {
        return [];
    }
}

describe('TenantsController — guard integration', () => {
    let app: INestApplication;

    const mockJwtService = {
        verify: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TestTenantsController],
            providers: [{ provide: JwtService, useValue: mockJwtService }],
        }).compile();

        app = module.createNestApplication();
        await app.init();
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await app.close();
    });

    it('GET /admin/tenants without token → 401', async () => {
        await request(app.getHttpServer()).get('/admin/tenants').expect(401);
    });

    it('GET /admin/tenants with valid token → not 401', async () => {
        mockJwtService.verify.mockReturnValue({ sub: 'uuid-1', username: 'admin' });

        const res = await request(app.getHttpServer())
            .get('/admin/tenants')
            .set('Authorization', 'Bearer validtoken');

        expect(res.status).not.toBe(401);
    });
});

describe('TenantsController — endpoints', () => {
    let app: INestApplication;

    const mockTenantsService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        generateEntryLink: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TenantsController],
            providers: [{ provide: TenantsService, useValue: mockTenantsService }],
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

    it('GET /admin/tenants → 200', async () => {
        const tenants = [{ id: 'uuid-1', firstName: 'Alice', lastName: 'Smith' }];
        mockTenantsService.findAll.mockResolvedValue(tenants);

        const res = await request(app.getHttpServer()).get('/admin/tenants');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(tenants);
    });

    it('GET /admin/tenants/:id → 200', async () => {
        const tenant = { id: 'uuid-1', firstName: 'Alice', lastName: 'Smith' };
        mockTenantsService.findOne.mockResolvedValue(tenant);

        const res = await request(app.getHttpServer()).get('/admin/tenants/uuid-1');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(tenant);
    });

    it('GET /admin/tenants/:id when NotFoundException → 404', async () => {
        mockTenantsService.findOne.mockRejectedValue(new NotFoundException('Tenant not found'));

        const res = await request(app.getHttpServer()).get('/admin/tenants/uuid-missing');

        expect(res.status).toBe(404);
    });

    it('POST /admin/tenants → 201', async () => {
        const tenant = { id: 'uuid-1', firstName: 'Alice', lastName: 'Smith', status: 'inactive' };
        mockTenantsService.create.mockResolvedValue(tenant);

        const res = await request(app.getHttpServer())
            .post('/admin/tenants')
            .send({ firstName: 'Alice', lastName: 'Smith' });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(tenant);
    });

    it('POST /admin/tenants when ConflictException → 409 with { duplicate: true, matchingIds }', async () => {
        mockTenantsService.create.mockRejectedValue(
            new ConflictException({ duplicate: true, matchingIds: ['uuid-1'] }),
        );

        const res = await request(app.getHttpServer())
            .post('/admin/tenants')
            .send({ firstName: 'Alice', lastName: 'Smith' });

        expect(res.status).toBe(409);
        expect(res.body).toEqual({ duplicate: true, matchingIds: ['uuid-1'] });
    });

    it('PATCH /admin/tenants/:id → 200', async () => {
        const tenant = { id: 'uuid-1', firstName: 'Alice', lastName: 'Updated' };
        mockTenantsService.update.mockResolvedValue(tenant);

        const res = await request(app.getHttpServer())
            .patch('/admin/tenants/uuid-1')
            .send({ lastName: 'Updated' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(tenant);
    });

    it('PATCH /admin/tenants/:id when NotFoundException → 404', async () => {
        mockTenantsService.update.mockRejectedValue(new NotFoundException('Tenant not found'));

        const res = await request(app.getHttpServer())
            .patch('/admin/tenants/uuid-missing')
            .send({ lastName: 'Updated' });

        expect(res.status).toBe(404);
    });

    it('DELETE /admin/tenants/:id → 404 (route does not exist)', async () => {
        const res = await request(app.getHttpServer()).delete('/admin/tenants/uuid-1');

        expect(res.status).toBe(404);
    });

    it('POST /admin/tenants/:id/entry-link → 201 with token', async () => {
        mockTenantsService.generateEntryLink.mockResolvedValue({ token: 'generated-uuid' });

        const res = await request(app.getHttpServer())
            .post('/admin/tenants/uuid-1/entry-link');

        expect(res.status).toBe(201);
        expect(res.body).toEqual({ token: 'generated-uuid' });
    });

    it('POST /admin/tenants/:id/entry-link → 404 when tenant not found', async () => {
        mockTenantsService.generateEntryLink.mockRejectedValue(new NotFoundException('Tenant not found'));

        const res = await request(app.getHttpServer())
            .post('/admin/tenants/missing-id/entry-link');

        expect(res.status).toBe(404);
    });
});
