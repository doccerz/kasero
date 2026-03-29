import { cookies } from 'next/headers';
import SpacesClient from './_components/spaces-client';

interface Space {
    id: string;
    name: string;
    description?: string;
}

export default async function SpacesPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const baseUrl = process.env.INTERNAL_API_URL;

    const res = await fetch(`${baseUrl}/admin/spaces`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
    });

    const spaces: Space[] = res.ok ? await res.json() : [];

    return <SpacesClient spaces={spaces} />;
}
