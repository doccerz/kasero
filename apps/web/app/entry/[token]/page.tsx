import EntryForm from './entry-form';

export default async function EntryPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;

    let status: 'valid' | 'used' | 'invalid' = 'invalid';

    try {
        const res = await fetch(
            `${process.env.INTERNAL_API_URL}/internal/tenants/entry/${token}`,
            { cache: 'no-store' },
        );
        if (res.status === 410) {
            status = 'used';
        } else if (res.ok) {
            status = 'valid';
        }
    } catch {
        status = 'invalid';
    }

    if (status === 'invalid') {
        return <main><p>Invalid or expired link</p></main>;
    }

    if (status === 'used') {
        return <main><p>Entry already submitted</p></main>;
    }

    return <EntryForm token={token} />;
}
