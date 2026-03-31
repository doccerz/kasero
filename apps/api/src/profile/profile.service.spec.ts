import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { DB_TOKEN } from '../database/database.module';

jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
    hash: jest.fn().mockResolvedValue('hashed_new_password'),
}));

import { compare, hash } from 'bcryptjs';

const mockCompare = compare as jest.MockedFunction<typeof compare>;
const mockHash = hash as jest.MockedFunction<typeof hash>;

describe('ProfileService', () => {
    let service: ProfileService;

    const fakeUser = {
        id: 'user-uuid',
        username: 'admin',
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash: 'hashed_password',
    };

    const mockDb = {
        select: jest.fn(),
        update: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProfileService,
                { provide: DB_TOKEN, useValue: mockDb },
            ],
        }).compile();

        service = module.get<ProfileService>(ProfileService);
        jest.clearAllMocks();
    });

    describe('getProfile()', () => {
        it('should return profile fields for user', async () => {
            const profileRow = { id: fakeUser.id, username: fakeUser.username, name: fakeUser.name, email: fakeUser.email };
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue([profileRow]),
                    }),
                }),
            });

            const result = await service.getProfile(fakeUser.id);
            expect(result).toEqual(profileRow);
        });

        it('should return undefined when user not found', async () => {
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const result = await service.getProfile('nonexistent-id');
            expect(result).toBeUndefined();
        });
    });

    describe('updateProfile()', () => {
        it('should update name and email and return updated profile', async () => {
            const updated = { id: fakeUser.id, username: fakeUser.username, name: 'New Name', email: 'new@example.com' };
            const returningMock = jest.fn().mockResolvedValue([updated]);
            const whereMock = jest.fn().mockReturnValue({ returning: returningMock });
            const setMock = jest.fn().mockReturnValue({ where: whereMock });
            mockDb.update.mockReturnValue({ set: setMock });

            const result = await service.updateProfile(fakeUser.id, { name: 'New Name', email: 'new@example.com' });
            expect(setMock).toHaveBeenCalledWith({ name: 'New Name', email: 'new@example.com' });
            expect(result).toEqual(updated);
        });
    });

    describe('updatePassword()', () => {
        it('should throw UnauthorizedException when user not found', async () => {
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });

            await expect(
                service.updatePassword('nonexistent', { currentPassword: 'old', newPassword: 'new' }),
            ).rejects.toBeInstanceOf(UnauthorizedException);
        });

        it('should throw UnauthorizedException when current password is wrong', async () => {
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue([fakeUser]),
                    }),
                }),
            });
            mockCompare.mockResolvedValue(false as never);

            await expect(
                service.updatePassword(fakeUser.id, { currentPassword: 'wrong', newPassword: 'new' }),
            ).rejects.toBeInstanceOf(UnauthorizedException);
        });

        it('should update password hash when current password is correct', async () => {
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue([fakeUser]),
                    }),
                }),
            });
            mockCompare.mockResolvedValue(true as never);

            const whereMock = jest.fn().mockResolvedValue([]);
            const setMock = jest.fn().mockReturnValue({ where: whereMock });
            mockDb.update.mockReturnValue({ set: setMock });

            await service.updatePassword(fakeUser.id, { currentPassword: 'correct', newPassword: 'newpass' });

            expect(mockHash).toHaveBeenCalledWith('newpass', 10);
            expect(setMock).toHaveBeenCalledWith({ passwordHash: 'hashed_new_password' });
        });
    });
});
