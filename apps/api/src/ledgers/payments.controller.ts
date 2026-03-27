import { Controller, Post, UseGuards, HttpCode, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LedgersService } from './ledgers.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/payments/:id')
export class PaymentsController {
    constructor(private readonly ledgersService: LedgersService) {}

    @Post('void')
    @HttpCode(200)
    void(@Param('id') id: string) {
        return this.ledgersService.voidPayment(id);
    }
}
