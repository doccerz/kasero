'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
    { label: 'Spaces', href: '/admin/spaces' },
    { label: 'Tenants', href: '/admin/tenants' },
];

export default function AdminNav() {
    const pathname = usePathname();
    return (
        <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            active
                                ? 'bg-[var(--surface-container)] text-[var(--on-surface)]'
                                : 'text-[var(--on-surface)] hover:bg-[var(--surface-container)]'
                        }`}
                    >
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
