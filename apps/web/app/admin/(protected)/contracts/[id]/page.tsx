import { cookies } from 'next/headers';
import Link from 'next/link';
import ContractDetailClient from './_components/contract-detail-client';

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
    billingDate?: string;
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
            <div className="p-6">
                <p className="text-red-600 text-sm">Contract not found.</p>
            </div>
        );
    }

    const amountDueValue = ledger ? parseFloat(ledger.amountDue) : 0;

    return (
        <div className="p-6">
            <div className="mb-6">
                <Link
                    href={`/admin/spaces/${contract.spaceId}`}
                    className="text-sm text-[var(--on-surface)] hover:underline"
                >
                    ← Back to Space
                </Link>
            </div>

            <h1 className="text-2xl font-bold text-[var(--on-surface)] font-[family-name:var(--font-display)] mb-4">Contract</h1>

            {/* Client component: action buttons + interactive payments table */}
            <ContractDetailClient contract={contract} payments={ledger?.payments ?? []} />

            {/* Contract summary */}
            <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)]/15 rounded-lg p-4 mb-6 text-sm grid grid-cols-2 gap-2 shadow-[0_10px_40px_rgba(13,28,46,0.06)]">
                <div><span className="font-medium text-[var(--on-surface-variant)]">Tenant:</span> <span className="text-[var(--on-surface)]">{contract.tenantName ?? contract.tenantId}</span></div>
                <div><span className="font-medium text-[var(--on-surface-variant)]">Status:</span> <span className="text-[var(--on-surface)]">{contract.status}</span></div>
                <div><span className="font-medium text-[var(--on-surface-variant)]">Period:</span> <span className="text-[var(--on-surface)]">{contract.startDate} – {contract.endDate}</span></div>
                <div><span className="font-medium text-[var(--on-surface-variant)]">Billing:</span> <span className="text-[var(--on-surface)]">{contract.billingFrequency}</span></div>
                <div><span className="font-medium text-[var(--on-surface-variant)]">Rent Amount:</span> <span className="font-mono text-[var(--on-surface)]">₱{contract.rentAmount}</span></div>
            </div>

            {/* Amount Due */}
            {ledger && (
                <div className={`rounded-lg p-4 mb-6 shadow-[0_10px_40px_rgba(13,28,46,0.06)] ${amountDueValue > 0 ? 'bg-[var(--error-container)]' : 'bg-[var(--primary-fixed-dim)]/20'}`}>
                    <p className="text-sm font-medium text-[var(--on-surface-variant)] uppercase tracking-wide mb-1">Amount Due</p>
                    <p className={`text-2xl font-bold font-mono ${amountDueValue > 0 ? 'text-[var(--error)]' : 'text-[var(--primary-fixed-dim)]'}`}>
                        ₱{ledger.amountDue}
                    </p>
                </div>
            )}

            {/* Payables */}
            <h2 className="text-sm font-semibold text-[var(--on-surface)] uppercase tracking-wide mb-3 mt-6 font-[family-name:var(--font-display)]">
                Payables
            </h2>
            {!ledger || ledger.payables.length === 0 ? (
                <p className="text-[var(--on-surface-variant)] text-sm mb-6">No payables.</p>
            ) : (
                <div className="bg-[var(--surface-container-lowest)] rounded-lg overflow-hidden shadow-[0_10px_40px_rgba(13,28,46,0.06)] mb-6">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[var(--surface-container)]">
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Period Start</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Period End</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Billing Date</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Due Date</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledger.payables.map((p) => (
                                <tr key={p.id} className="hover:bg-[var(--surface-container-low)] transition-colors">
                                    <td className="px-5 py-4 text-[var(--on-surface-variant)]">{p.periodStart}</td>
                                    <td className="px-5 py-4 text-[var(--on-surface-variant)]">{p.periodEnd}</td>
                                    <td className="px-5 py-4 text-[var(--on-surface-variant)]">{p.billingDate ?? '—'}</td>
                                    <td className="px-5 py-4 text-[var(--on-surface-variant)]">{p.dueDate}</td>
                                    <td className="px-5 py-4 font-mono text-[var(--on-surface)]">₱{p.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Fund */}
            <h2 className="text-sm font-semibold text-[var(--on-surface)] uppercase tracking-wide mb-3 mt-6 font-[family-name:var(--font-display)]">
                Fund
            </h2>
            {!ledger || ledger.fund.length === 0 ? (
                <p className="text-[var(--on-surface-variant)] text-sm">No fund entries.</p>
            ) : (
                <div className="bg-[var(--surface-container-lowest)] rounded-lg overflow-hidden shadow-[0_10px_40px_rgba(13,28,46,0.06)]">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[var(--surface-container)]">
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Type</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledger.fund.map((f) => (
                                <tr key={f.id} className="hover:bg-[var(--surface-container-low)] transition-colors">
                                    <td className="px-5 py-4 text-[var(--on-surface)] capitalize">{f.type}</td>
                                    <td className="px-5 py-4 font-mono text-[var(--on-surface)]">₱{f.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
