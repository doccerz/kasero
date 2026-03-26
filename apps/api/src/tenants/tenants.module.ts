import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';

@Module({
    imports: [AuthModule],
    providers: [TenantsService],
    controllers: [TenantsController],
})
export class TenantsModule {}
