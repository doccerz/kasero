'use client';

import { useEffect, useState } from 'react';

const INPUT_CLASS =
    'w-full bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md px-4 py-2.5 text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]';
const BUTTON_CLASS =
    'bg-[var(--primary-fixed-dim)] text-[var(--on-primary-fixed)] rounded-md px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed';

export default function ProfilePage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [profileStatus, setProfileStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [profileError, setProfileError] = useState<string | null>(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordStatus, setPasswordStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [passwordError, setPasswordError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/admin/profile')
            .then((r) => r.json())
            .then((data) => {
                setName(data.name ?? '');
                setEmail(data.email ?? '');
            })
            .catch(() => {
                setProfileError('Could not load profile.');
            });
    }, []);

    async function handleProfileSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProfileStatus('loading');
        setProfileError(null);

        try {
            const res = await fetch('/api/admin/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email }),
            });

            if (res.ok) {
                setProfileStatus('success');
            } else {
                const body = await res.json().catch(() => ({}));
                setProfileError(body.message ?? 'Failed to update profile.');
                setProfileStatus('error');
            }
        } catch {
            setProfileError('An error occurred. Please try again.');
            setProfileStatus('error');
        }
    }

    async function handlePasswordSubmit(e: React.FormEvent) {
        e.preventDefault();
        setPasswordError(null);

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }

        setPasswordStatus('loading');

        try {
            const res = await fetch('/api/admin/profile/password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            if (res.ok) {
                setPasswordStatus('success');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                const body = await res.json().catch(() => ({}));
                setPasswordError(body.message ?? 'Failed to update password.');
                setPasswordStatus('error');
            }
        } catch {
            setPasswordError('An error occurred. Please try again.');
            setPasswordStatus('error');
        }
    }

    return (
        <div className="p-6 max-w-lg space-y-8">
            <h1 className="text-2xl font-bold text-[var(--on-surface)] font-[family-name:var(--font-display)]">Profile</h1>

            {/* Profile Details */}
            <div className="bg-[var(--surface-container-lowest)] rounded-lg shadow-[0_10px_40px_rgba(13,28,46,0.06)] p-8">
                <h2 className="text-lg font-semibold text-[var(--on-surface)] font-[family-name:var(--font-display)] mb-6">Profile Details</h2>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                            Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={INPUT_CLASS}
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={INPUT_CLASS}
                        />
                    </div>
                    {profileStatus === 'success' && (
                        <p className="text-sm text-[var(--primary)] bg-[var(--primary-fixed-dim)]/20 rounded-md px-4 py-2.5">
                            Profile updated successfully.
                        </p>
                    )}
                    {profileError && (
                        <p className="text-sm text-[var(--error)] bg-[var(--error-container)] rounded-md px-4 py-2.5">
                            {profileError}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={profileStatus === 'loading'}
                        className={BUTTON_CLASS}
                    >
                        {profileStatus === 'loading' ? 'Saving…' : 'Save Changes'}
                    </button>
                </form>
            </div>

            {/* Change Password */}
            <div className="bg-[var(--surface-container-lowest)] rounded-lg shadow-[0_10px_40px_rgba(13,28,46,0.06)] p-8">
                <h2 className="text-lg font-semibold text-[var(--on-surface)] font-[family-name:var(--font-display)] mb-6">Change Password</h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                            Current Password
                        </label>
                        <input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className={INPUT_CLASS}
                        />
                    </div>
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                            New Password
                        </label>
                        <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className={INPUT_CLASS}
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                            Confirm New Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className={INPUT_CLASS}
                        />
                    </div>
                    {passwordStatus === 'success' && (
                        <p className="text-sm text-[var(--primary)] bg-[var(--primary-fixed-dim)]/20 rounded-md px-4 py-2.5">
                            Password updated successfully.
                        </p>
                    )}
                    {passwordError && (
                        <p className="text-sm text-[var(--error)] bg-[var(--error-container)] rounded-md px-4 py-2.5">
                            {passwordError}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={passwordStatus === 'loading'}
                        className={BUTTON_CLASS}
                    >
                        {passwordStatus === 'loading' ? 'Updating…' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
