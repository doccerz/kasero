import { Controller, Get, UseGuards, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/spaces')
class TestSpacesController {
    @Get()
    list() {
        return [];
    }
}

describe('SpacesController — guard integration', () => {
    let app: INestApplication;

    const mockJwtService = {
        verify: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TestSpacesController],
            providers: [{ provide: JwtService, useValue: mockJwtService }],
        }).compile();

        app = module.createNestApplication();
        await app.init();
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await app.close();
    });

    it('GET /admin/spaces without token → 401', async () => {
        await request(app.getHttpServer()).get('/admin/spaces').expect(401);
    });

    it('GET /admin/spaces with valid token → not 401', async () => {
        mockJwtService.verify.mockReturnValue({ sub: 'uuid-1', username: 'admin' });

        const res = await request(app.getHttpServer())
            .get('/admin/spaces')
            .set('Authorization', 'Bearer validtoken');

        expect(res.status).not.toBe(401);
    });
});

describe('SpacesController — endpoints', () => {
    let app: INestApplication;

    const mockSpacesService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SpacesController],
            providers: [{ provide: SpacesService, useValue: mockSpacesService }],
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

    it('GET /admin/spaces → 200 with findAll() result', async () => {
        const spaces = [{ id: 'uuid-1', name: 'Unit 1' }];
        mockSpacesService.findAll.mockResolvedValue(spaces);

        const res = await request(app.getHttpServer()).get('/admin/spaces');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(spaces);
    });

    it('GET /admin/spaces/:id → 200 with findOne() result', async () => {
        const space = { id: 'uuid-1', name: 'Unit 1' };
        mockSpacesService.findOne.mockResolvedValue(space);

        const res = await request(app.getHttpServer()).get('/admin/spaces/uuid-1');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(space);
    });

    it('GET /admin/spaces/:id when NotFoundException → 404', async () => {
        mockSpacesService.findOne.mockRejectedValue(new NotFoundException('Space not found'));

        const res = await request(app.getHttpServer()).get('/admin/spaces/uuid-missing');

        expect(res.status).toBe(404);
    });

    it('POST /admin/spaces → 201 with create() result', async () => {
        const space = { id: 'uuid-1', name: 'Unit 1' };
        mockSpacesService.create.mockResolvedValue(space);

        const res = await request(app.getHttpServer())
            .post('/admin/spaces')
            .send({ name: 'Unit 1' });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(space);
    });

    it('PATCH /admin/spaces/:id → 200 with update() result', async () => {
        const space = { id: 'uuid-1', name: 'Unit 1 Updated' };
        mockSpacesService.update.mockResolvedValue(space);

        const res = await request(app.getHttpServer())
            .patch('/admin/spaces/uuid-1')
            .send({ name: 'Unit 1 Updated' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(space);
    });

    it('PATCH /admin/spaces/:id when NotFoundException → 404', async () => {
        mockSpacesService.update.mockRejectedValue(new NotFoundException('Space not found'));

        const res = await request(app.getHttpServer())
            .patch('/admin/spaces/uuid-missing')
            .send({ name: 'Updated' });

        expect(res.status).toBe(404);
    });

    it('DELETE /admin/spaces/:id → 200 with remove() result (soft-deleted record)', async () => {
        const space = { id: 'uuid-1', name: 'Unit 1', deletedAt: new Date().toISOString() };
        mockSpacesService.remove.mockResolvedValue(space);

        const res = await request(app.getHttpServer()).delete('/admin/spaces/uuid-1');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(space);
    });

    it('DELETE /admin/spaces/:id when NotFoundException → 404', async () => {
        mockSpacesService.remove.mockRejectedValue(new NotFoundException('Space not found'));

        const res = await request(app.getHttpServer()).delete('/admin/spaces/uuid-missing');

        expect(res.status).toBe(404);
    });
});
