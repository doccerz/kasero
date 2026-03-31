'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (res.ok) {
                router.push('/admin/spaces');
            } else {
                const body = await res.json().catch(() => ({}));
                setError(body.message ?? 'Invalid credentials. Please try again.');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <span className="text-3xl font-bold tracking-tight text-[var(--tertiary)] font-[family-name:var(--font-display)]">Kasero</span>
                    <p className="text-sm text-[var(--on-surface-variant)] mt-1">Admin Portal</p>
                </div>
                <div className="bg-[var(--surface-container-lowest)] rounded-lg shadow-[0_10px_40px_rgba(13,28,46,0.06)] p-8">
                    <h1 className="text-lg font-semibold text-[var(--on-surface)] font-[family-name:var(--font-display)] mb-6">Sign in</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-[var(--on-surface)] mb-1"
                            >
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md px-4 py-2.5 text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-[var(--on-surface)] mb-1"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md px-4 py-2.5 text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-[var(--error)] bg-[var(--error-container)] rounded-md px-4 py-2.5">
                                {error}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[var(--primary-fixed-dim)] text-[var(--on-primary-fixed)] rounded-md px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in…' : 'Log in'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
