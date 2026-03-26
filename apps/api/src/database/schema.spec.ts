import {
    spaces,
    tenants,
    contracts,
    payables,
    payments,
    fund,
    settings,
    appVersion,
    adminUsers,
    publicAccessCodes,
    audit,
} from './schema';

describe('Schema', () => {
    it('should export spaces table', () => {
        expect(spaces).toBeDefined();
    });

    it('should export tenants table', () => {
        expect(tenants).toBeDefined();
    });

    it('should export contracts table', () => {
        expect(contracts).toBeDefined();
    });

    it('should export payables table', () => {
        expect(payables).toBeDefined();
    });

    it('should export payments table', () => {
        expect(payments).toBeDefined();
    });

    it('should export fund table', () => {
        expect(fund).toBeDefined();
    });

    it('should export settings table', () => {
        expect(settings).toBeDefined();
    });

    it('should export appVersion table', () => {
        expect(appVersion).toBeDefined();
    });

    it('should export adminUsers table', () => {
        expect(adminUsers).toBeDefined();
    });

    it('should export publicAccessCodes table', () => {
        expect(publicAccessCodes).toBeDefined();
    });

    it('should export audit table', () => {
        expect(audit).toBeDefined();
    });
});
