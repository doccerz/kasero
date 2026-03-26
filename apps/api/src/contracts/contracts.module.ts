import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';

@Module({
    imports: [AuthModule],
    providers: [ContractsService],
    controllers: [ContractsController],
})
export class ContractsModule {}
