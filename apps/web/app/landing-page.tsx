'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
    const [code, setCode] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    function handleAccessCode(e: React.FormEvent) {
        e.preventDefault();
        if (code.trim()) {
            router.push('/public/' + code.trim());
        }
    }

    async function handleLogin(e: React.FormEvent) {
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
        <div className="min-h-screen bg-[var(--surface)] flex flex-col items-center justify-center px-4 py-10">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <span className="text-3xl font-bold tracking-tight text-[var(--tertiary)] font-[family-name:var(--font-display)]">Kasero</span>
                </div>

                {/* Tenant: access code */}
                <div className="bg-[var(--surface-container-lowest)] rounded-lg shadow-[0_10px_40px_rgba(13,28,46,0.06)] p-8">
                    <h2 className="text-base font-semibold text-[var(--on-surface)] font-[family-name:var(--font-display)] mb-1">View your rental status</h2>
                    <p className="text-sm text-[var(--on-surface-variant)] mb-5">
                        Enter the access code provided by your landlord.
                    </p>
                    <form onSubmit={handleAccessCode} className="space-y-3">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Access code"
                            className="w-full bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md px-4 py-2.5 text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                        />
                        <button
                            type="submit"
                            className="w-full bg-[var(--primary-fixed-dim)] text-[var(--on-primary-fixed)] rounded-md px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            View Status
                        </button>
                    </form>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-[var(--outline-variant)]/30" />
                    <span className="text-xs text-[var(--on-surface-variant)]">or</span>
                    <div className="flex-1 h-px bg-[var(--outline-variant)]/30" />
                </div>

                {/* Admin: login */}
                <div className="bg-[var(--surface-container-lowest)] rounded-lg shadow-[0_10px_40px_rgba(13,28,46,0.06)] p-8">
                    <h2 className="text-base font-semibold text-[var(--on-surface)] font-[family-name:var(--font-display)] mb-5">Admin sign in</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
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
                            className="w-full bg-[var(--surface-container-high)] text-[var(--on-surface)] rounded-md px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in…' : 'Log in'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
