import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const token = request.cookies.get('auth_token')?.value;
    const baseUrl = process.env.INTERNAL_API_URL;

    let res: Response;
    try {
        res = await fetch(`${baseUrl}/admin/payments/${id}/void`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return NextResponse.json({ message: 'Unable to reach server' }, { status: 503 });
    }

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to void payment' }));
        return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
}
