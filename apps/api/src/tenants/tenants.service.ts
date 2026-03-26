import { Injectable, Inject } from '@nestjs/common';
import { or, isNull, gt, sql } from 'drizzle-orm';
import { DB_TOKEN } from '../database/database.module';
import { SettingsService } from '../settings/settings.service';
import { tenants } from '../database/schema';

@Injectable()
export class TenantsService {
    constructor(
        @Inject(DB_TOKEN) private readonly db: any,
        private readonly settingsService: SettingsService,
    ) {}

    async findAll(): Promise<typeof tenants.$inferSelect[]> {
        const hideExpired = this.settingsService.getBoolean('tenant.hide_expired');
        const query = this.db.select().from(tenants);
        if (hideExpired) {
            return query.where(
                or(isNull(tenants.expirationDate), gt(tenants.expirationDate, sql`CURRENT_DATE`))
            );
        }
        return query;
    }
}
