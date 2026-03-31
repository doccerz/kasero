import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
    const token = request.cookies.get('auth_token');

    if (!token) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/((?!login).+)'],
};
