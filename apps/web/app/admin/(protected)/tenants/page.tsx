import { cookies } from 'next/headers';
import TenantsClient from './_components/tenants-client';

interface Tenant {
    id: string;
    firstName: string;
    lastName: string;
    status: string;
    contactInfo?: { email?: string; phone?: string };
}

export default async function TenantsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const baseUrl = process.env.INTERNAL_API_URL;

    const res = await fetch(`${baseUrl}/admin/tenants`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
    });

    const tenants: Tenant[] = res.ok ? await res.json() : [];

    return <TenantsClient tenants={tenants} />;
}
