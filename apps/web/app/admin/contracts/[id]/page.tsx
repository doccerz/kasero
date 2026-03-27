import { cookies } from 'next/headers';
import Link from 'next/link';

interface Contract {
    id: string;
    spaceId: string;
    tenantId: string;
    tenantName?: string;
    startDate: string;
    endDate: string;
    rentAmount: string;
    billingFrequency: string;
    dueDateRule: number;
    status: string;
}

interface Payable {
    id: string;
    periodStart: string;
    periodEnd: string;
    dueDate: string;
    amount: string;
}

interface Payment {
    id: string;
    date: string;
    amount: string;
    voidedAt?: string | null;
}

interface FundEntry {
    id: string;
    type: string;
    amount: string;
}

interface Ledger {
    amountDue: string;
    payables: Payable[];
    payments: Payment[];
    fund: FundEntry[];
}

export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const baseUrl = process.env.INTERNAL_API_URL;
    const headers = { Authorization: `Bearer ${token}` };

    const [contractRes, ledgerRes] = await Promise.all([
        fetch(`${baseUrl}/admin/contracts/${id}`, { cache: 'no-store', headers }),
        fetch(`${baseUrl}/admin/contracts/${id}/ledger`, { cache: 'no-store', headers }),
    ]);

    const contract: Contract | null = contractRes.ok ? await contractRes.json() : null;
    const ledger: Ledger | null = ledgerRes.ok ? await ledgerRes.json() : null;

    if (!contract) {
        return (
            <div style={{ padding: '1.5rem' }}>
                <p style={{ color: '#dc2626' }}>Contract not found.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <Link
                    href={`/admin/spaces/${contract.spaceId}`}
                    style={{ color: '#2563eb', textDecoration: 'underline', fontSize: '0.875rem' }}
                >
                    ← Back to Space
                </Link>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Contract</h1>

            {/* Contract summary */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div><strong>Tenant:</strong> {contract.tenantName ?? contract.tenantId}</div>
                    <div><strong>Space ID:</strong> {contract.spaceId}</div>
                    <div><strong>Period:</strong> {contract.startDate} – {contract.endDate}</div>
                    <div><strong>Status:</strong> {contract.status}</div>
                    <div><strong>Rent Amount:</strong> ₱{contract.rentAmount}</div>
                    <div><strong>Billing Frequency:</strong> {contract.billingFrequency}</div>
                </div>
            </div>

            {/* Amount Due */}
            {ledger && (
                <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
                    <p style={{ fontWeight: 700, fontSize: '1.125rem' }}>
                        Amount Due: <span style={{ color: parseFloat(ledger.amountDue) > 0 ? '#dc2626' : '#166534' }}>₱{ledger.amountDue}</span>
                    </p>
                </div>
            )}

            {/* Payables */}
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>Payables</h2>
            {!ledger || ledger.payables.length === 0 ? (
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>No payables.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1rem' }}>Period Start</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Period End</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Due Date</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ledger.payables.map((p) => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '0.75rem 1rem' }}>{p.periodStart}</td>
                                <td style={{ padding: '0.75rem 1rem' }}>{p.periodEnd}</td>
                                <td style={{ padding: '0.75rem 1rem' }}>{p.dueDate}</td>
                                <td style={{ padding: '0.75rem 1rem' }}>₱{p.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Payments */}
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>Payments</h2>
            {!ledger || ledger.payments.length === 0 ? (
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>No payments.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Voided</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ledger.payments.map((p) => (
                            <tr
                                key={p.id}
                                style={{
                                    borderBottom: '1px solid #e5e7eb',
                                    textDecoration: p.voidedAt ? 'line-through' : undefined,
                                    color: p.voidedAt ? '#9ca3af' : undefined,
                                }}
                            >
                                <td style={{ padding: '0.75rem 1rem' }}>{p.date}</td>
                                <td style={{ padding: '0.75rem 1rem' }}>₱{p.amount}</td>
                                <td style={{ padding: '0.75rem 1rem' }}>{p.voidedAt ? 'Yes' : 'No'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Fund */}
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>Fund</h2>
            {!ledger || ledger.fund.length === 0 ? (
                <p style={{ color: '#6b7280' }}>No fund entries.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ledger.fund.map((f) => (
                            <tr key={f.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '0.75rem 1rem' }}>{f.type}</td>
                                <td style={{ padding: '0.75rem 1rem' }}>₱{f.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
