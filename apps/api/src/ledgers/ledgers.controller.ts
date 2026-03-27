import { Controller, Get, Post, UseGuards, Param, Query, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LedgersService } from './ledgers.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/contracts/:id')
export class ContractLedgerController {
    constructor(private readonly ledgersService: LedgersService) {}

    @Get('ledger')
    getLedger(@Param('id') id: string, @Query('referenceDate') referenceDate?: string) {
        return this.ledgersService.getLedger(id, referenceDate);
    }

    @Post('payments')
    recordPayment(@Param('id') id: string, @Body() body: { amount: string; date?: string }) {
        return this.ledgersService.recordPayment(id, body);
    }
}
