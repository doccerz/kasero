import { NextRequest, NextResponse } from 'next/server';

function isJwtValid(token: string): boolean {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        const payload = JSON.parse(
            atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
        );
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return false;
        return true;
    } catch {
        return false;
    }
}

export function proxy(request: NextRequest) {
    const token = request.cookies.get('auth_token');

    if (!token || !isJwtValid(token.value)) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/((?!login).+)'],
};
