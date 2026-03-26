import { Module } from '@nestjs/common';
import { PublicAccessService } from './public-access.service';
import { PublicAccessController } from './public-access.controller';

@Module({
  providers: [PublicAccessService],
  controllers: [PublicAccessController]
})
export class PublicAccessModule {}
