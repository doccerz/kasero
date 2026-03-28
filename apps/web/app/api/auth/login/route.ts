import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const baseUrl = process.env.INTERNAL_API_URL;

    let res: Response;
    try {
        res = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: 'Unable to reach server' }, { status: 503 });
    }

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Invalid credentials' }));
        return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    const response = NextResponse.json({ ok: true });
    response.cookies.set('auth_token', data.access_token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    });
    return response;
}
