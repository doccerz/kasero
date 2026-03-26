import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedException();
        try {
            const token = authHeader.slice(7);
            request.user = this.jwtService.verify(token);
            return true;
        } catch {
            throw new UnauthorizedException();
        }
    }
}
