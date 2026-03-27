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
    const contracts = allContracts.filter((c) => c.spaceId === id);

    if (!space) {
        return (
            <div style={{ padding: '1.5rem' }}>
                <p style={{ color: '#dc2626' }}>Space not found.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <Link href="/admin/dashboard" style={{ color: '#2563eb', textDecoration: 'underline', fontSize: '0.875rem' }}>
                    ← Back to Dashboard
                </Link>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{space.name}</h1>
            {space.description && (
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{space.description}</p>
            )}

            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Contracts</h2>
            {contracts.length === 0 ? (
                <p style={{ color: '#6b7280' }}>No contracts for this space.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1rem' }}>Tenant</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Start</th>
                            <th style={{ padding: '0.75rem 1rem' }}>End</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Link</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contracts.map((contract) => {
                            const isPosted = contract.status === 'posted';
                            return (
                                <tr
                                    key={contract.id}
                                    style={{
                                        borderBottom: '1px solid #e5e7eb',
                                        fontWeight: isPosted ? 700 : 400,
                                        background: isPosted ? '#f0fdf4' : undefined,
                                    }}
                                >
                                    <td style={{ padding: '0.75rem 1rem' }}>{contract.tenantName ?? contract.tenantId}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>{contract.startDate}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>{contract.endDate}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>{contract.status}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <Link
                                            href={`/admin/contracts/${contract.id}`}
                                            style={{ color: '#2563eb', textDecoration: 'underline' }}
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}
