'use client';

import { useState } from 'react';

export default function EntryForm({ token }: { token: string }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [consent, setConsent] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const res = await fetch(`/internal/tenants/entry/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName,
                lastName,
                contactInfo: { phone, email },
                consentGiven: consent,
            }),
        });

        if (res.ok) {
            setSubmitted(true);
        } else {
            const body = await res.json().catch(() => ({}));
            setError(body.message ?? 'Submission failed. Please try again.');
        }
    }

    if (submitted) {
        return <main><p>Details submitted</p></main>;
    }

    return (
        <main>
            <h1>Enter your details</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>First Name</label>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div>
                    <label>Last Name</label>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
                <div>
                    <label>Phone</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                    <label>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                    <label>
                        <input
                            type="checkbox"
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            required
                        />
                        I consent to the collection of my personal information
                    </label>
                </div>
                {error && <p>{error}</p>}
                <button type="submit">Submit</button>
            </form>
        </main>
    );
}
