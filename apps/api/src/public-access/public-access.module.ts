import { Module } from '@nestjs/common';
import { PublicAccessService } from './public-access.service';
import { PublicAccessController } from './public-access.controller';
import { LedgersModule } from '../ledgers/ledgers.module';

@Module({
    imports: [LedgersModule],
    providers: [PublicAccessService],
    controllers: [PublicAccessController],
})
export class PublicAccessModule {}
