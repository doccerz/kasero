import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { or, isNull, gt, sql, eq, and, isNotNull } from 'drizzle-orm';
import { DB_TOKEN } from '../database/database.module';
import { SettingsService } from '../settings/settings.service';
import { tenants } from '../database/schema';

function sortKeys(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sortKeys);
    return Object.keys(obj as object).sort().reduce((acc, k) => {
        (acc as any)[k] = sortKeys((obj as any)[k]);
        return acc;
    }, {} as object);
}

function jsonEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));
}

function toDateString(d: Date): string {
    return d.toISOString().split('T')[0];
}

@Injectable()
export class TenantsService {
    constructor(
        @Inject(DB_TOKEN) private readonly db: any,
        private readonly settingsService: SettingsService,
    ) {}

    async findAll(): Promise<typeof tenants.$inferSelect[]> {
        const hideExpired = this.settingsService.getBoolean('tenant.hide_expired');
        const notDeleted = isNull(tenants.deletedAt);
        const query = this.db.select().from(tenants);
        if (hideExpired) {
            return query.where(
                and(notDeleted, or(isNull(tenants.expirationDate), gt(tenants.expirationDate, sql`CURRENT_DATE`)))
            );
        }
        return query.where(notDeleted);
    }

    async findOne(id: string): Promise<typeof tenants.$inferSelect> {
        const rows = await this.db.select().from(tenants).where(and(eq(tenants.id, id), isNull(tenants.deletedAt)));
        if (!rows[0]) throw new NotFoundException('Tenant not found');
        return rows[0];
    }

    async create(data: { firstName: string; lastName: string; contactInfo?: unknown; metadata?: unknown }) {
        const candidates = await this.db.select().from(tenants)
            .where(and(eq(tenants.firstName, data.firstName), eq(tenants.lastName, data.lastName)));
        const incoming = data.contactInfo ?? null;
        const matches = candidates.filter((t: any) => jsonEqual(t.contactInfo, incoming));
        if (matches.length > 0) {
            throw new ConflictException({ duplicate: true, matchingIds: matches.map((t: any) => t.id) });
        }

        const expirationDate = toDateString(new Date(Date.now() + 10 * 365.25 * 24 * 60 * 60 * 1000));
        const rows = await this.db.insert(tenants)
            .values({ ...data, status: 'inactive', expirationDate })
            .returning();
        return rows[0];
    }

    async update(id: string, data: Partial<typeof tenants.$inferInsert>) {
        const rows = await this.db.update(tenants)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(tenants.id, id))
            .returning();
        if (!rows[0]) throw new NotFoundException('Tenant not found');
        return rows[0];
    }

    async remove(id: string): Promise<typeof tenants.$inferSelect> {
        const rows = await this.db.update(tenants)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where(and(eq(tenants.id, id), isNull(tenants.deletedAt)))
            .returning();
        if (!rows[0]) throw new NotFoundException('Tenant not found');
        return rows[0];
    }

    async generateEntryLink(tenantId: string): Promise<{ token: string }> {
        await this.findOne(tenantId);
        const token = crypto.randomUUID();
        await this.db.update(tenants)
            .set({ entryToken: token, entryTokenUsedAt: null, updatedAt: new Date() })
            .where(eq(tenants.id, tenantId))
            .returning();
        return { token };
    }
}
