export default async function PublicAccessPage({
    params,
}: {
    params: Promise<{ code: string }>;
}) {
    const { code } = await params;

    let data: any = null;
    let error: string | null = null;

    try {
        const res = await fetch(
            `${process.env.INTERNAL_API_URL}/internal/contracts/public/${code}`,
            { cache: 'no-store' },
        );
        if (res.status === 404) {
            error = 'Invalid or expired access code';
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
            <main>
                <p>{error}</p>
            </main>
        );
    }

    const { ledger } = data;

    return (
        <main>
            <h1>Amount Due</h1>
            <p className="amount-due">{ledger.amount_due}</p>

            <h2>Payables</h2>
            <table>
                <thead>
                    <tr>
                        <th>Period</th>
                        <th>Due Date</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {ledger.payables.map((p: any) => (
                        <tr key={p.id}>
                            <td>{p.periodStart} – {p.periodEnd}</td>
                            <td>{p.dueDate}</td>
                            <td>{p.amount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {ledger.fund.length > 0 && (
                <>
                    <h2>Fund</h2>
                    <ul>
                        {ledger.fund.map((f: any) => (
                            <li key={f.id}>{f.type}: {f.amount}</li>
                        ))}
                    </ul>
                </>
            )}
        </main>
    );
}
