jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}));

jest.mock('next/headers', () => ({
    cookies: jest.fn(() => ({
        get: jest.fn(),
    })),
}));

import AdminLayout from '../app/admin/layout';

describe('AdminLayout', () => {
    it('should be defined', () => {
        expect(AdminLayout).toBeDefined();
    });
});
