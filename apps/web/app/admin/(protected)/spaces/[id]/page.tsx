import { cookies } from 'next/headers';
import Link from 'next/link';

interface Space {
    id: string;
    name: string;
    description?: string;
}

interface Contract {
    id: string;
    spaceId: string;
    tenantId: string;
    tenantName?: string;
    startDate: string;
    endDate: string;
    status: string;
}

export default async function SpacePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const baseUrl = process.env.INTERNAL_API_URL;
    const headers = { Authorization: `Bearer ${token}` };

    const [spaceRes, contractsRes] = await Promise.all([
        fetch(`${baseUrl}/admin/spaces/${id}`, { cache: 'no-store', headers }),
        fetch(`${baseUrl}/admin/contracts`, { cache: 'no-store', headers }),
    ]);

    const space: Space | null = spaceRes.ok ? await spaceRes.json() : null;
    const allContracts: Contract[] = contractsRes.ok ? await contractsRes.json() : [];

    const STATUS_ORDER: Record<string, number> = { posted: 0, draft: 1, voided: 2 };
    const contracts = allContracts
        .filter((c) => c.spaceId === id)
        .sort((a, b) => {
            const statusDiff = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
            if (statusDiff !== 0) return statusDiff;
            return b.startDate.localeCompare(a.startDate);
        });

    if (!space) {
        return (
            <div className="p-6">
                <p className="text-red-600 text-sm">Space not found.</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <Link
                    href="/admin/spaces"
                    className="text-sm text-blue-600 hover:underline"
                >
                    ← Back to Spaces
                </Link>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">{space.name}</h1>
            {space.description && (
                <p className="text-slate-500 text-sm mb-6">{space.description}</p>
            )}

            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 mt-6">
                Contracts
            </h2>
            {contracts.length === 0 ? (
                <p className="text-slate-500 text-sm">No contracts for this space.</p>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">
                                    Tenant
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">
                                    Start
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">
                                    End
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">
                                    Link
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {contracts.map((contract) => {
                                const isPosted = contract.status === 'posted';
                                const isVoided = contract.status === 'voided';
                                return (
                                    <tr
                                        key={contract.id}
                                        className={`border-b border-slate-100 ${
                                            isVoided
                                                ? 'text-slate-400'
                                                : isPosted
                                                  ? 'bg-green-50 font-semibold'
                                                  : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <td className="px-4 py-3 text-slate-700">
                                            {contract.tenantName ?? contract.tenantId}
                                        </td>
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
