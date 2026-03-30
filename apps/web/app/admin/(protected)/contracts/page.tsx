import { cookies } from 'next/headers';
import ContractsClient from './_components/contracts-client';

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

interface Tenant {
    id: string;
    name: string;
}

interface Space {
    id: string;
    name: string;
}

export default async function ContractsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const baseUrl = process.env.INTERNAL_API_URL;
    const headers = { Authorization: `Bearer ${token}` };

    const [contractsRes, tenantsRes, spacesRes] = await Promise.all([
        fetch(`${baseUrl}/admin/contracts`, { cache: 'no-store', headers }),
        fetch(`${baseUrl}/admin/tenants`, { cache: 'no-store', headers }),
        fetch(`${baseUrl}/admin/spaces`, { cache: 'no-store', headers }),
    ]);

    const contracts: Contract[] = contractsRes.ok ? await contractsRes.json() : [];
    const tenants: Tenant[] = tenantsRes.ok ? await tenantsRes.json() : [];
    const spaces: Space[] = spacesRes.ok ? await spacesRes.json() : [];

    return <ContractsClient contracts={contracts} tenants={tenants} spaces={spaces} />;
}
