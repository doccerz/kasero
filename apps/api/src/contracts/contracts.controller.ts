import { Controller, Get, Post, Patch, Param, Body, HttpCode, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContractsService } from './contracts.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/contracts')
export class ContractsController {
    constructor(private readonly contractsService: ContractsService) {}

    @Get()
    findAll() {
        return this.contractsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.contractsService.findOne(id);
    }

    @Post()
    create(
        @Body() body: {
            tenantId: string;
            spaceId: string;
            startDate: string;
            endDate: string;
            rentAmount: string;
            billingFrequency: 'monthly' | 'quarterly' | 'annually';
            dueDateRule: number;
            depositAmount?: string;
            advanceMonths?: number;
            metadata?: unknown;
        },
    ) {
        return this.contractsService.create(body);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
        return this.contractsService.update(id, body as any);
    }

    @Post(':id/post')
    @HttpCode(200)
    post(@Param('id') id: string) {
        return this.contractsService.post(id);
    }

    @Post(':id/revoke-code')
    @HttpCode(200)
    revokeCode(@Param('id') id: string) {
        return this.contractsService.revokeAccessCode(id);
    }
}
