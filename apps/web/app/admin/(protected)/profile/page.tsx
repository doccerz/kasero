'use client';

import { useEffect, useState } from 'react';

const INPUT_CLASS =
    'w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent';
const BUTTON_CLASS =
    'bg-slate-800 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

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
            <h1 className="text-2xl font-bold text-slate-800">Profile</h1>

            {/* Profile Details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <h2 className="text-lg font-semibold text-slate-800 mb-6">Profile Details</h2>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
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
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
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
                        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                            Profile updated successfully.
                        </p>
                    )}
                    {profileError && (
                        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <h2 className="text-lg font-semibold text-slate-800 mb-6">Change Password</h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 mb-1">
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
                        <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">
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
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
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
                        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                            Password updated successfully.
                        </p>
                    )}
                    {passwordError && (
                        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
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
