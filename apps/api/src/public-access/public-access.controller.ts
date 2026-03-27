import { Controller, Get, Post, Param, Query, Body, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { PublicAccessService } from './public-access.service';

@Controller('internal')
export class PublicAccessController {
    constructor(private readonly service: PublicAccessService) {}

    @Get('contracts/public/:code')
    getPublicStatus(@Param('code') code: string, @Query('referenceDate') referenceDate?: string) {
        return this.service.getPublicStatus(code, referenceDate);
    }

    @Get('tenants/entry/:token')
    async resolveEntryToken(@Param('token') token: string) {
        const result = await this.service.resolveEntryToken(token);
        if (result.usedAt) {
            throw new HttpException('Link already used', HttpStatus.GONE);
        }
        return result;
    }

    @Post('tenants/entry/:token')
    @HttpCode(HttpStatus.CREATED)
    submitEntry(
        @Param('token') token: string,
        @Body() body: { firstName: string; lastName: string; contactInfo: any; consentGiven: boolean },
    ) {
        return this.service.submitEntry(token, body);
    }
}
