import { cookies } from 'next/headers';
import Link from 'next/link';

interface DashboardEntry {
    id: string;
    name: string;
    description?: string;
    occupancyStatus: 'overdue' | 'nearing' | 'occupied' | 'vacant';
    tenantId?: string;
    tenantName?: string;
    contractId?: string;
    amountDue?: string;
    nextDueDate?: string;
}

const STATUS_LABELS: Record<DashboardEntry['occupancyStatus'], string> = {
    overdue: 'Overdue',
    nearing: 'Nearing',
    occupied: 'Occupied',
    vacant: 'Vacant',
};

const STATUS_CLASSES: Record<DashboardEntry['occupancyStatus'], string> = {
    overdue: 'bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded',
    nearing: 'bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded',
    occupied: 'bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded',
    vacant: 'bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded',
};

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    const baseUrl = process.env.INTERNAL_API_URL;
    const res = await fetch(`${baseUrl}/admin/dashboard`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
    });

    const entries: DashboardEntry[] = res.ok ? await res.json() : [];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>
            {entries.length === 0 ? (
                <p className="text-slate-500 text-sm">No spaces found.</p>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">
                                    Space Name
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">
                                    Tenant
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">
                                    Amount Due
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">
                                    Next Due Date
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => (
                                <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-medium">
                                        <Link
                                            href={`/admin/spaces/${entry.id}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {entry.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={STATUS_CLASSES[entry.occupancyStatus]}>
                                            {STATUS_LABELS[entry.occupancyStatus]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{entry.tenantName ?? '—'}</td>
                                    <td className="px-4 py-3 font-mono text-slate-700">
                                        {entry.amountDue !== undefined ? `₱${entry.amountDue}` : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{entry.nextDueDate ?? '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
