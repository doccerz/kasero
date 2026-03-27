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
        <main>
            <h1>Enter your access code</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Access code"
                />
                <button type="submit">View Status</button>
            </form>
        </main>
    );
}
