import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LedgersService } from './ledgers.service';
import { ContractLedgerController } from './ledgers.controller';
import { PaymentsController } from './payments.controller';

@Module({
    imports: [AuthModule],
    providers: [LedgersService],
    controllers: [ContractLedgerController, PaymentsController],
    exports: [LedgersService],
})
export class LedgersModule {}
