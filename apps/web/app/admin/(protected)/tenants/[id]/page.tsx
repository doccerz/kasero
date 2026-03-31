import { cookies } from 'next/headers';
import Link from 'next/link';

interface Tenant {
    id: string;
    firstName: string;
    lastName: string;
    status: string;
    contactInfo?: { email?: string; phone?: string };
}

interface Contract {
    id: string;
    tenantId: string;
    spaceId: string;
    spaceName?: string;
    startDate: string;
    endDate: string;
    status: string;
}

export default async function TenantPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const baseUrl = process.env.INTERNAL_API_URL;
    const headers = { Authorization: `Bearer ${token}` };

    const [tenantRes, contractsRes] = await Promise.all([
        fetch(`${baseUrl}/admin/tenants/${id}`, { cache: 'no-store', headers }),
        fetch(`${baseUrl}/admin/contracts`, { cache: 'no-store', headers }),
    ]);

    const tenant: Tenant | null = tenantRes.ok ? await tenantRes.json() : null;
    const allContracts: Contract[] = contractsRes.ok ? await contractsRes.json() : [];
    const contracts = allContracts.filter((c) => c.tenantId === id);

    if (!tenant) {
        return (
            <div className="p-6">
                <p className="text-red-600 text-sm">Tenant not found.</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <Link href="/admin/tenants" className="text-sm text-blue-600 hover:underline">
                    ← Back to Tenants
                </Link>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4">
                {tenant.firstName} {tenant.lastName}
            </h1>

            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8 text-sm">
                <dl className="space-y-2">
                    <div className="flex gap-4">
                        <dt className="w-20 text-slate-500 font-medium">Email</dt>
                        <dd className="text-slate-700">{tenant.contactInfo?.email ?? '—'}</dd>
                    </div>
                    <div className="flex gap-4">
                        <dt className="w-20 text-slate-500 font-medium">Phone</dt>
                        <dd className="text-slate-700">{tenant.contactInfo?.phone ?? '—'}</dd>
                    </div>
                    <div className="flex gap-4">
                        <dt className="w-20 text-slate-500 font-medium">Status</dt>
                        <dd className="text-slate-700 capitalize">{tenant.status}</dd>
                    </div>
                </dl>
            </div>

            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                Contracts
            </h2>
            {contracts.length === 0 ? (
                <p className="text-slate-500 text-sm">No contracts for this tenant.</p>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Space</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Start</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">End</th>
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
                                        className={`border-b border-slate-100 ${
                                            isPosted ? 'bg-green-50 font-semibold' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <td className="px-4 py-3 text-slate-700">{contract.spaceName ?? contract.spaceId}</td>
                                        <td className="px-4 py-3 text-slate-600">{contract.startDate}</td>
                                        <td className="px-4 py-3 text-slate-600">{contract.endDate}</td>
                                        <td className="px-4 py-3 text-slate-600">{contract.status}</td>
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
