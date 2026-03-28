'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const [code, setCode] = useState('');
    const router = useRouter();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (code.trim()) {
            router.push('/public/' + code.trim());
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <span className="text-2xl font-bold tracking-tight text-slate-800">Kasero</span>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                    <h1 className="text-lg font-semibold text-slate-800 mb-1">View your rental status</h1>
                    <p className="text-sm text-slate-500 mb-6">
                        Enter the access code provided by your landlord.
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Access code"
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                        />
                        <button
                            type="submit"
                            className="w-full bg-slate-800 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-slate-700 transition-colors"
                        >
                            View Status
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
