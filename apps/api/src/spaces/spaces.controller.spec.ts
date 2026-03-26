import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { SpacesController } from './spaces.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('SpacesController — guard integration', () => {
    let app: INestApplication;

    const mockJwtService = {
        verify: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SpacesController],
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
