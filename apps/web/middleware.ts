import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token');
    const isLoginPage = request.nextUrl.pathname === '/admin/login';

    if (!token && !isLoginPage) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    if (token && isLoginPage) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
