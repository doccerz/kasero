import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('ProfileController', () => {
    let controller: ProfileController;

    const mockProfileService = {
        getProfile: jest.fn(),
        updateProfile: jest.fn(),
        updatePassword: jest.fn(),
    };

    const mockReq = { user: { sub: 'user-uuid' } };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProfileController],
            providers: [{ provide: ProfileService, useValue: mockProfileService }],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<ProfileController>(ProfileController);
        jest.clearAllMocks();
    });

    describe('GET /admin/profile', () => {
        it('should return profile for authenticated user', async () => {
            const profile = { id: 'user-uuid', username: 'admin', name: 'Admin', email: 'admin@example.com' };
            mockProfileService.getProfile.mockResolvedValue(profile);

            const result = await controller.getProfile(mockReq as any);
            expect(mockProfileService.getProfile).toHaveBeenCalledWith('user-uuid');
            expect(result).toEqual(profile);
        });
    });

    describe('PATCH /admin/profile', () => {
        it('should update profile with provided fields', async () => {
            const updated = { id: 'user-uuid', username: 'admin', name: 'New Name', email: 'new@example.com' };
            mockProfileService.updateProfile.mockResolvedValue(updated);

            const result = await controller.updateProfile(mockReq as any, { name: 'New Name', email: 'new@example.com' });
            expect(mockProfileService.updateProfile).toHaveBeenCalledWith('user-uuid', { name: 'New Name', email: 'new@example.com' });
            expect(result).toEqual(updated);
        });
    });

    describe('PATCH /admin/profile/password', () => {
        it('should call updatePassword with correct params', async () => {
            mockProfileService.updatePassword.mockResolvedValue(undefined);

            await controller.updatePassword(mockReq as any, { currentPassword: 'old', newPassword: 'new' });
            expect(mockProfileService.updatePassword).toHaveBeenCalledWith('user-uuid', { currentPassword: 'old', newPassword: 'new' });
        });

        it('should propagate UnauthorizedException when password is wrong', async () => {
            mockProfileService.updatePassword.mockRejectedValue(new UnauthorizedException('Current password is incorrect'));

            await expect(
                controller.updatePassword(mockReq as any, { currentPassword: 'wrong', newPassword: 'new' }),
            ).rejects.toBeInstanceOf(UnauthorizedException);
        });
    });
});
