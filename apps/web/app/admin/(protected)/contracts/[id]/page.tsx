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
                    className="text-sm text-blue-600 hover:underline"
                >
                    ← Back to Space
                </Link>
            </div>

            <h1 className="text-2xl font-bold text-slate-800 mb-4">Contract</h1>

            {/* Contract summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 text-sm grid grid-cols-2 gap-2">
                <div><span className="font-medium text-slate-500">Tenant:</span> <span className="text-slate-800">{contract.tenantName ?? contract.tenantId}</span></div>
                <div><span className="font-medium text-slate-500">Status:</span> <span className="text-slate-800">{contract.status}</span></div>
                <div><span className="font-medium text-slate-500">Period:</span> <span className="text-slate-800">{contract.startDate} – {contract.endDate}</span></div>
                <div><span className="font-medium text-slate-500">Billing:</span> <span className="text-slate-800">{contract.billingFrequency}</span></div>
                <div><span className="font-medium text-slate-500">Rent Amount:</span> <span className="font-mono text-slate-800">₱{contract.rentAmount}</span></div>
            </div>

            {/* Amount Due */}
            {ledger && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <p className="text-sm font-medium text-amber-700 uppercase tracking-wide mb-1">Amount Due</p>
                    <p className={`text-2xl font-bold font-mono ${amountDueValue > 0 ? 'text-red-600' : 'text-green-700'}`}>
                        ₱{ledger.amountDue}
                    </p>
                </div>
            )}

            {/* Payables */}
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 mt-6">
                Payables
            </h2>
            {!ledger || ledger.payables.length === 0 ? (
                <p className="text-slate-500 text-sm mb-6">No payables.</p>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Period Start</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Period End</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Due Date</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledger.payables.map((p) => (
                                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-600">{p.periodStart}</td>
                                    <td className="px-4 py-3 text-slate-600">{p.periodEnd}</td>
                                    <td className="px-4 py-3 text-slate-600">{p.dueDate}</td>
                                    <td className="px-4 py-3 font-mono text-slate-800">₱{p.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Payments */}
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 mt-6">
                Payments
            </h2>
            {!ledger || ledger.payments.length === 0 ? (
                <p className="text-slate-500 text-sm mb-6">No payments.</p>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Date</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Amount</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Voided</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledger.payments.map((p) => (
                                <tr
                                    key={p.id}
                                    className={`border-b border-slate-100 ${
                                        p.voidedAt ? 'line-through text-slate-400' : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                >
                                    <td className="px-4 py-3">{p.date}</td>
                                    <td className="px-4 py-3 font-mono">₱{p.amount}</td>
                                    <td className="px-4 py-3">{p.voidedAt ? 'Yes' : 'No'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Fund */}
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 mt-6">
                Fund
            </h2>
            {!ledger || ledger.fund.length === 0 ? (
                <p className="text-slate-500 text-sm">No fund entries.</p>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Type</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledger.fund.map((f) => (
                                <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-700 capitalize">{f.type}</td>
                                    <td className="px-4 py-3 font-mono text-slate-800">₱{f.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
