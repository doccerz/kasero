import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const baseUrl = process.env.INTERNAL_API_URL;
    const body = await request.json();

    let res: Response;
    try {
        res = await fetch(`${baseUrl}/admin/spaces`, {
            method: 'POST',
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
        const error = await res.json().catch(() => ({ message: 'Failed to create space' }));
        return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
}
