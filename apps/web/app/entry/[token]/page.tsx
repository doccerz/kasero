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
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <p className="text-slate-600 text-sm">Invalid or expired link. Please request a new one.</p>
            </div>
        );
    }

    if (status === 'used') {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <p className="text-slate-600 text-sm">Your details have already been submitted. Thank you.</p>
            </div>
        );
    }

    return <EntryForm token={token} />;
}
