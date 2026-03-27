import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { SettingsModule } from './settings/settings.module';
import { SpacesModule } from './spaces/spaces.module';
import { TenantsModule } from './tenants/tenants.module';
import { ContractsModule } from './contracts/contracts.module';
import { LedgersModule } from './ledgers/ledgers.module';
import { PublicAccessModule } from './public-access/public-access.module';
import { AuditModule } from './audit/audit.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
    imports: [DatabaseModule, AuthModule, SettingsModule, SpacesModule, TenantsModule, ContractsModule, LedgersModule, PublicAccessModule, AuditModule, DashboardModule],
    controllers: [AppController],
    providers: [],
})
export class AppModule {}
