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

const STATUS_STYLES: Record<DashboardEntry['occupancyStatus'], string> = {
    overdue: 'background-color: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;',
    nearing: 'background-color: #fef9c3; color: #854d0e; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;',
    occupied: 'background-color: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;',
    vacant: 'background-color: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;',
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
        <div style={{ padding: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Dashboard</h1>
            {entries.length === 0 ? (
                <p style={{ color: '#6b7280' }}>No spaces found.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1rem' }}>Space Name</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Tenant</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Amount Due</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Next Due Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry) => (
                            <tr key={entry.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    <Link
                                        href={`/admin/spaces/${entry.id}`}
                                        style={{ color: '#2563eb', textDecoration: 'underline' }}
                                    >
                                        {entry.name}
                                    </Link>
                                </td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    <span style={STATUS_STYLES[entry.occupancyStatus]}>
                                        {STATUS_LABELS[entry.occupancyStatus]}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem 1rem' }}>{entry.tenantName ?? '—'}</td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    {entry.amountDue !== undefined ? `₱${entry.amountDue}` : '—'}
                                </td>
                                <td style={{ padding: '0.75rem 1rem' }}>{entry.nextDueDate ?? '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
