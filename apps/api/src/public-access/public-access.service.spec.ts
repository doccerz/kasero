import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, GoneException } from '@nestjs/common';
import { PublicAccessService } from './public-access.service';
import { LedgersService } from '../ledgers/ledgers.service';
import { DB_TOKEN } from '../database/database.module';

function buildMockDb({ selectRows = [] as any[], mutationRows = [] as any[] } = {}) {
    const returning = jest.fn().mockResolvedValue(mutationRows);
    const whereForMutation = jest.fn().mockReturnValue({ returning });
    const set = jest.fn().mockReturnValue({ where: whereForMutation });
    const whereForSelect = jest.fn().mockResolvedValue(selectRows);
    const leftJoin = jest.fn().mockReturnValue({ where: whereForSelect });
    const from = jest.fn().mockReturnValue({ where: whereForSelect, leftJoin });
    return {
        select: jest.fn().mockReturnValue({ from }),
        update: jest.fn().mockReturnValue({ set }),
        _from: from,
        _leftJoin: leftJoin,
        _whereForSelect: whereForSelect,
        _whereForMutation: whereForMutation,
        _returning: returning,
    };
}

describe('PublicAccessService', () => {
    let service: PublicAccessService;
    let mockLedgers: { getLedger: jest.Mock };

    async function createService(mockDb: any) {
        mockLedgers = { getLedger: jest.fn() };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PublicAccessService,
                { provide: DB_TOKEN, useValue: mockDb },
                { provide: LedgersService, useValue: mockLedgers },
            ],
        }).compile();
        service = module.get<PublicAccessService>(PublicAccessService);
    }

    describe('getPublicStatus', () => {
        it('returns contractId and ledger for a valid active code', async () => {
            const row = { contractId: 'cid-1' };
            const mockDb = buildMockDb({ selectRows: [row] });
            const ledger = { payables: [], payments: [], fund: [], amount_due: '0.00' };
            await createService(mockDb);
            mockLedgers.getLedger.mockResolvedValue(ledger);

            const result = await service.getPublicStatus('some-code');

            expect(result).toEqual({ contractId: 'cid-1', ledger });
            expect(mockLedgers.getLedger).toHaveBeenCalledWith('cid-1', undefined);
        });

        it('throws NotFoundException when code not found or revoked', async () => {
            const mockDb = buildMockDb({ selectRows: [] });
            await createService(mockDb);

            await expect(service.getPublicStatus('bad-code')).rejects.toThrow(NotFoundException);
        });

        it('passes referenceDate to getLedger', async () => {
            const row = { contractId: 'cid-1' };
            const mockDb = buildMockDb({ selectRows: [row] });
            const ledger = { payables: [], payments: [], fund: [], amount_due: '0.00' };
            await createService(mockDb);
            mockLedgers.getLedger.mockResolvedValue(ledger);

            await service.getPublicStatus('some-code', '2025-01-01');

            expect(mockLedgers.getLedger).toHaveBeenCalledWith('cid-1', '2025-01-01');
        });
    });

    describe('resolveEntryToken', () => {
        it('returns tenantId and usedAt for a known token', async () => {
            const tenant = { id: 'tid-1', entryTokenUsedAt: null };
            const mockDb = buildMockDb({ selectRows: [tenant] });
            await createService(mockDb);

            const result = await service.resolveEntryToken('valid-token');

            expect(result).toEqual({ tenantId: 'tid-1', usedAt: null });
        });

        it('throws NotFoundException for unknown token', async () => {
            const mockDb = buildMockDb({ selectRows: [] });
            await createService(mockDb);

            await expect(service.resolveEntryToken('unknown')).rejects.toThrow(NotFoundException);
        });
    });

    describe('submitEntry', () => {
        it('throws BadRequestException when consentGiven is false', async () => {
            const mockDb = buildMockDb();
            await createService(mockDb);

            await expect(
                service.submitEntry('token', { firstName: 'A', lastName: 'B', contactInfo: null, consentGiven: false })
            ).rejects.toThrow(BadRequestException);
        });

        it('throws NotFoundException when token not found', async () => {
            const mockDb = buildMockDb({ selectRows: [] });
            await createService(mockDb);

            await expect(
                service.submitEntry('bad-token', { firstName: 'A', lastName: 'B', contactInfo: null, consentGiven: true })
            ).rejects.toThrow(NotFoundException);
        });

        it('throws GoneException when token already used', async () => {
            const tenant = { id: 'tid-1', entryTokenUsedAt: new Date('2025-01-01') };
            const mockDb = buildMockDb({ selectRows: [tenant] });
            await createService(mockDb);

            await expect(
                service.submitEntry('used-token', { firstName: 'A', lastName: 'B', contactInfo: null, consentGiven: true })
            ).rejects.toThrow(GoneException);
        });

        it('updates tenant and returns row on valid submission', async () => {
            const tenant = { id: 'tid-1', entryTokenUsedAt: null };
            const updated = { id: 'tid-1', firstName: 'Alice', lastName: 'Smith' };
            const mockDb = buildMockDb({ selectRows: [tenant], mutationRows: [updated] });
            await createService(mockDb);

            const result = await service.submitEntry('valid-token', {
                firstName: 'Alice',
                lastName: 'Smith',
                contactInfo: { phone: '123' },
                consentGiven: true,
            });

            expect(mockDb.update).toHaveBeenCalled();
            expect(result).toEqual(updated);
        });
    });
});
