import { cookies } from 'next/headers';
import Link from 'next/link';
import SpaceContractsClient from './_components/space-contracts-client';

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
    rentAmount?: string;
    billingFrequency?: string;
    dueDateRule?: number;
    depositAmount?: string;
    advanceMonths?: number;
    status: string;
}

interface Tenant {
    id: string;
    firstName: string;
    lastName: string;
}

export default async function SpacePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const baseUrl = process.env.INTERNAL_API_URL;
    const headers = { Authorization: `Bearer ${token}` };

    const [spaceRes, contractsRes, tenantsRes] = await Promise.all([
        fetch(`${baseUrl}/admin/spaces/${id}`, { cache: 'no-store', headers }),
        fetch(`${baseUrl}/admin/contracts`, { cache: 'no-store', headers }),
        fetch(`${baseUrl}/admin/tenants`, { cache: 'no-store', headers }),
    ]);

    const space: Space | null = spaceRes.ok ? await spaceRes.json() : null;
    const allContracts: Contract[] = contractsRes.ok ? await contractsRes.json() : [];
    const tenants: Tenant[] = tenantsRes.ok ? await tenantsRes.json() : [];

    const spaceContracts = allContracts.filter((c) => c.spaceId === id);

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

            <div className="mt-6">
                <SpaceContractsClient
                    spaceId={id}
                    contracts={spaceContracts}
                    tenants={tenants}
                />
            </div>
        </div>
    );
}
