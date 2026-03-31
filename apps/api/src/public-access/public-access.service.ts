import { Injectable, Inject, NotFoundException, BadRequestException, GoneException } from '@nestjs/common';
import { eq, isNull, and } from 'drizzle-orm';
import { DB_TOKEN } from '../database/database.module';
import { LedgersService } from '../ledgers/ledgers.service';
import { tenants, publicAccessCodes, contracts } from '../database/schema';

@Injectable()
export class PublicAccessService {
    constructor(
        @Inject(DB_TOKEN) private readonly db: any,
        private readonly ledgers: LedgersService,
    ) {}

    async getPublicStatus(code: string, referenceDate?: string) {
        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!UUID_RE.test(code)) throw new NotFoundException('Invalid or expired access code');

        const rows = await this.db
            .select({ contractId: publicAccessCodes.contractId })
            .from(publicAccessCodes)
            .leftJoin(contracts, eq(contracts.id, publicAccessCodes.contractId))
            .where(
                and(
                    eq(publicAccessCodes.code, code),
                    isNull(publicAccessCodes.revokedAt),
                    eq(contracts.status, 'posted'),
                ),
            );

        if (!rows.length) {
            throw new NotFoundException('Invalid or expired access code');
        }

        const { contractId } = rows[0];
        const ledger = await this.ledgers.getLedger(contractId, referenceDate);
        return { contractId, ledger };
    }

    async resolveEntryToken(token: string) {
        const rows = await this.db
            .select()
            .from(tenants)
            .where(eq(tenants.entryToken, token));

        if (!rows.length) {
            throw new NotFoundException('Entry token not found');
        }

        const tenant = rows[0];
        return { tenantId: tenant.id, usedAt: tenant.entryTokenUsedAt };
    }

    async submitEntry(
        token: string,
        body: { firstName: string; lastName: string; contactInfo: any; consentGiven: boolean },
    ) {
        if (!body.consentGiven) {
            throw new BadRequestException('Consent required');
        }

        const rows = await this.db
            .select()
            .from(tenants)
            .where(eq(tenants.entryToken, token));

        if (!rows.length) {
            throw new NotFoundException('Entry token not found');
        }

        const tenant = rows[0];
        if (tenant.entryTokenUsedAt !== null && tenant.entryTokenUsedAt !== undefined) {
            throw new GoneException('Link already used');
        }

        const [updated] = await this.db
            .update(tenants)
            .set({
                firstName: body.firstName,
                lastName: body.lastName,
                contactInfo: body.contactInfo,
                entryTokenUsedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(tenants.entryToken, token))
            .returning();

        return updated;
    }
}
