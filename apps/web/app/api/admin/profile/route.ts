import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const baseUrl = process.env.INTERNAL_API_URL;

    let res: Response;
    try {
        res = await fetch(`${baseUrl}/admin/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return NextResponse.json({ message: 'Unable to reach server' }, { status: 503 });
    }

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to load profile' }));
        return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const baseUrl = process.env.INTERNAL_API_URL;
    const body = await request.json();

    let res: Response;
    try {
        res = await fetch(`${baseUrl}/admin/profile`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: 'Unable to reach server' }, { status: 503 });
    }

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to update profile' }));
        return NextResponse.json(error, { status: res.status });
    }

    return NextResponse.json({ ok: true });
}
