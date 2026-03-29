import { cookies } from 'next/headers';
import Link from 'next/link';

interface Contract {
    id: string;
    spaceId: string;
    tenantId: string;
    tenantName?: string;
    spaceName?: string;
    startDate: string;
    endDate: string;
    rentAmount: string;
    status: string;
}

export default async function ContractsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const baseUrl = process.env.INTERNAL_API_URL;

    const res = await fetch(`${baseUrl}/admin/contracts`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
    });

    const contracts: Contract[] = res.ok ? await res.json() : [];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Contracts</h1>
            {contracts.length === 0 ? (
                <p className="text-slate-500 text-sm">No contracts found.</p>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Tenant</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Space</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Start</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">End</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Rent</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Status</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contracts.map((contract) => {
                                const isPosted = contract.status === 'posted';
                                return (
                                    <tr
                                        key={contract.id}
                                        className={`border-b border-slate-100 transition-colors ${
                                            isPosted ? 'bg-green-50' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <td className="px-4 py-3 text-slate-700">{contract.tenantName ?? contract.tenantId}</td>
                                        <td className="px-4 py-3 text-slate-700">{contract.spaceName ?? contract.spaceId}</td>
                                        <td className="px-4 py-3 text-slate-600">{contract.startDate}</td>
                                        <td className="px-4 py-3 text-slate-600">{contract.endDate}</td>
                                        <td className="px-4 py-3 font-mono text-slate-800">₱{contract.rentAmount}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                                isPosted
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {contract.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/contracts/${contract.id}`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
