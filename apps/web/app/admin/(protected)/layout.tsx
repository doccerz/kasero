import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminNav from '../_components/admin-nav';

async function fetchProfile(token: string | undefined) {
    if (!token) return null;
    try {
        const res = await fetch(
            `${process.env.INTERNAL_API_URL}/admin/profile`,
            {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            },
        );
        if (!res.ok) return null;
        return res.json() as Promise<{ username: string; name?: string | null }>;
    } catch {
        return null;
    }
}

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const profile = await fetchProfile(token);
    if (!profile) redirect('/admin/login');
    const displayName = profile.name || profile.username || 'Admin';

    return (
        <div className="flex h-screen bg-[var(--surface)]">
            {/* Sidebar */}
            <aside className="w-56 bg-[var(--surface-container-highest)] flex flex-col flex-shrink-0">
                <div className="px-6 py-5">
                    <Link href="/admin/profile" className="block hover:opacity-80 transition-opacity">
                        <span className="text-[var(--on-surface)] font-bold text-lg tracking-tight font-[family-name:var(--font-display)]">{displayName}</span>
                        <span className="text-[var(--on-surface-variant)] text-xs block mt-0.5">Admin</span>
                    </Link>
                </div>
                <AdminNav />
                <div className="px-3 py-4">
                    <form action="/api/auth/logout" method="POST">
                        <button
                            type="submit"
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] transition-colors text-left"
                        >
                            Logout
                        </button>
                    </form>
                </div>
            </aside>
            {/* Main content area */}
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    );
}
