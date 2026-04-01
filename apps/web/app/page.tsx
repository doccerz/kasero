import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LandingPage from './landing-page';

function isJwtValid(token: string): boolean {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        const payload = JSON.parse(
            atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
        );
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return false;
        return true;
    } catch {
        return false;
    }
}

export default async function HomePage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (token && isJwtValid(token)) {
        redirect('/admin/spaces');
    }
    return <LandingPage />;
}
