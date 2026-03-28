export default async function PublicAccessPage({
    params,
}: {
    params: Promise<{ code: string }>;
}) {
    const { code } = await params;

    let data: {
        ledger: {
            amount_due: string;
            payables: { id: string; periodStart: string; periodEnd: string; dueDate: string; amount: string }[];
            fund: { id: string; type: string; amount: string }[];
        };
    } | null = null;
    let error: string | null = null;

    try {
        const res = await fetch(
            `${process.env.INTERNAL_API_URL}/internal/contracts/public/${code}`,
            { cache: 'no-store' },
        );
        if (res.status === 404) {
            error = 'Invalid or expired access code.';
        } else if (!res.ok) {
            error = 'An error occurred. Please try again later.';
        } else {
            data = await res.json();
        }
    } catch {
        error = 'An error occurred. Please try again later.';
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <p className="text-slate-600 text-sm">{error}</p>
            </div>
        );
    }

    const { ledger } = data!;
    const amountDue = parseFloat(ledger.amount_due);

    return (
        <div className="space-y-6">
            {/* Amount Due */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Amount Due
                </p>
                <p className={`text-3xl font-bold font-mono ${amountDue > 0 ? 'text-red-600' : 'text-green-700'}`}>
                    ₱{amountDue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
            </div>

            {/* Payables */}
            {ledger.payables.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                            Payables
                        </h2>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">
                                    Period
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">
                                    Due Date
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">
                                    Amount
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledger.payables.map((p) => (
                                <tr key={p.id} className="border-b border-slate-100 last:border-0">
                                    <td className="px-4 py-3 text-slate-600">
                                        {p.periodStart} – {p.periodEnd}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{p.dueDate}</td>
                                    <td className="px-4 py-3 font-mono text-slate-800">₱{p.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Fund */}
            {ledger.fund.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                        Fund
                    </h2>
                    <ul className="space-y-2">
                        {ledger.fund.map((f) => (
                            <li key={f.id} className="flex justify-between text-sm">
                                <span className="text-slate-600 capitalize">{f.type}</span>
                                <span className="font-mono text-slate-800">₱{f.amount}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
