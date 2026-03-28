jest.mock('./database', () => ({
    db: {
        select: jest.fn(),
        insert: jest.fn(),
    },
}));

jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password'),
}));

import { seedDefaultSettings, seedAdminUser, seedAppVersion } from './seed';
import { db } from './database';

describe('seed functions (unit)', () => {
    let mockOnConflictDoNothing: jest.Mock;
    let mockValues: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockOnConflictDoNothing = jest.fn().mockResolvedValue([]);
        mockValues = jest.fn().mockReturnValue({ onConflictDoNothing: mockOnConflictDoNothing });
        (db.insert as jest.Mock).mockReturnValue({ values: mockValues });
    });

    describe('seedDefaultSettings', () => {
        it('calls onConflictDoNothing (no duplicate insert)', async () => {
            await seedDefaultSettings();

            expect(db.insert).toHaveBeenCalledTimes(1);
            expect(mockValues).toHaveBeenCalled();
            expect(mockOnConflictDoNothing).toHaveBeenCalled();
        });
    });

    describe('seedAdminUser', () => {
        it('calls onConflictDoNothing (no duplicate insert)', async () => {
            await seedAdminUser('admin', 'password123');

            expect(db.insert).toHaveBeenCalledTimes(1);
            expect(mockValues).toHaveBeenCalled();
            expect(mockOnConflictDoNothing).toHaveBeenCalled();
        });
    });

    describe('seedAppVersion', () => {
        it('inserts when select returns empty array', async () => {
            const mockLimit = jest.fn().mockResolvedValue([]);
            const mockFrom = jest.fn().mockReturnValue({ limit: mockLimit });
            (db.select as jest.Mock).mockReturnValue({ from: mockFrom });

            await seedAppVersion('1.0.0');

            expect(db.select).toHaveBeenCalledTimes(1);
            expect(db.insert).toHaveBeenCalledTimes(1);
            expect(mockValues).toHaveBeenCalledWith({ version: '1.0.0' });
        });

        it('skips insert when select returns existing row', async () => {
            const mockLimit = jest.fn().mockResolvedValue([{ version: '1.0.0', createdAt: new Date() }]);
            const mockFrom = jest.fn().mockReturnValue({ limit: mockLimit });
            (db.select as jest.Mock).mockReturnValue({ from: mockFrom });

            await seedAppVersion('1.0.0');

            expect(db.select).toHaveBeenCalledTimes(1);
            expect(db.insert).not.toHaveBeenCalled();
        });
    });
});
