import { cookies } from 'next/headers';
import SpacesClient from './_components/spaces-client';

interface Space {
    id: string;
    name: string;
    description?: string;
}

interface DashboardEntry {
    id: string;
    name: string;
    occupancyStatus: 'overdue' | 'nearing' | 'occupied' | 'vacant';
    tenantId?: string;
    tenantName?: string;
    contractId?: string;
    amountDue?: string;
    nextDueDate?: string;
}

export default async function SpacesPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const baseUrl = process.env.INTERNAL_API_URL;
    const headers = { Authorization: `Bearer ${token}` };

    const [spacesRes, dashboardRes] = await Promise.all([
        fetch(`${baseUrl}/admin/spaces`, { cache: 'no-store', headers }),
        fetch(`${baseUrl}/admin/dashboard`, { cache: 'no-store', headers }),
    ]);

    const spaces: Space[] = spacesRes.ok ? await spacesRes.json() : [];
    const dashboardEntries: DashboardEntry[] = dashboardRes.ok ? await dashboardRes.json() : [];

    return <SpacesClient spaces={spaces} dashboardEntries={dashboardEntries} />;
}
