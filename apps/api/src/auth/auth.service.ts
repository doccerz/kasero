import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { DB_TOKEN } from '../database/database.module';
import { adminUsers } from '../database/schema';

@Injectable()
export class AuthService {
    constructor(
        @Inject(DB_TOKEN) private readonly db: any,
        private readonly jwtService: JwtService,
    ) {}

    async login(username: string, password: string): Promise<{ access_token: string }> {
        const rows = await this.db
            .select()
            .from(adminUsers)
            .where(eq(adminUsers.username, username))
            .limit(1);

        const user = rows[0];
        if (!user) throw new UnauthorizedException();

        const passwordMatch = await compare(password, user.passwordHash);
        if (!passwordMatch) throw new UnauthorizedException();

        const access_token = this.jwtService.sign({ sub: user.id, username: user.username });
        return { access_token };
    }
}
