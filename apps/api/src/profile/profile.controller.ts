import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfileService } from './profile.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @Get()
    getProfile(@Request() req: any) {
        return this.profileService.getProfile(req.user.sub);
    }

    @Patch()
    updateProfile(@Request() req: any, @Body() body: { name?: string; email?: string }) {
        return this.profileService.updateProfile(req.user.sub, body);
    }

    @Patch('password')
    updatePassword(@Request() req: any, @Body() body: { currentPassword: string; newPassword: string }) {
        return this.profileService.updatePassword(req.user.sub, body);
    }
}
