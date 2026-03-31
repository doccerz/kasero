'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Tenant {
    id: string;
    firstName: string;
    lastName: string;
    status: string;
    contactInfo?: { email?: string; phone?: string };
}

interface TenantFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

const EMPTY_FORM: TenantFormData = { firstName: '', lastName: '', email: '', phone: '' };

export default function TenantsClient({ tenants }: { tenants: Tenant[] }) {
    const router = useRouter();
    const [modal, setModal] = useState<{ mode: 'create' | 'edit'; tenant?: Tenant } | null>(null);
    const [form, setForm] = useState<TenantFormData>(EMPTY_FORM);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function openCreate() {
        setForm(EMPTY_FORM);
        setError('');
        setModal({ mode: 'create' });
    }

    function openEdit(tenant: Tenant) {
        setForm({
            firstName: tenant.firstName,
            lastName: tenant.lastName,
            email: tenant.contactInfo?.email ?? '',
            phone: tenant.contactInfo?.phone ?? '',
        });
        setError('');
        setModal({ mode: 'edit', tenant });
    }

    function closeModal() {
        setModal(null);
        setError('');
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const isEdit = modal?.mode === 'edit';
        const url = isEdit ? `/api/admin/tenants/${modal.tenant!.id}` : '/api/admin/tenants';
        const method = isEdit ? 'PATCH' : 'POST';

        const contactInfo: Record<string, string> = {};
        if (form.email) contactInfo.email = form.email;
        if (form.phone) contactInfo.phone = form.phone;

        const body: Record<string, unknown> = {
            firstName: form.firstName,
            lastName: form.lastName,
        };
        if (Object.keys(contactInfo).length > 0) body.contactInfo = contactInfo;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.message ?? 'Something went wrong');
            } else {
                closeModal();
                router.refresh();
            }
        } catch {
            setError('Unable to reach server');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-[var(--on-surface)] font-[family-name:var(--font-display)]">Tenants</h1>
                <button
                    onClick={openCreate}
                    className="px-4 py-2 bg-[var(--primary-fixed-dim)] text-[var(--on-primary-fixed)] text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
                >
                    New Tenant
                </button>
            </div>

            {tenants.length === 0 ? (
                <p className="text-[var(--on-surface-variant)] text-sm">No tenants found.</p>
            ) : (
                <div className="bg-[var(--surface-container-lowest)] rounded-lg overflow-hidden shadow-[0_10px_40px_rgba(13,28,46,0.06)]">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[var(--surface-container)]">
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Name</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Email</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Phone</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-right font-[family-name:var(--font-display)]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.map((tenant, idx) => (
                                <tr key={tenant.id} className={`hover:bg-[var(--surface-container-low)] transition-colors ${idx % 2 === 0 ? 'bg-[var(--surface-container-lowest)]' : 'bg-[var(--surface-container-low)]'}`}>
                                    <td className="px-5 py-4 font-medium">
                                        <Link href={`/admin/tenants/${tenant.id}`} className="text-[var(--on-surface)] hover:underline">
                                            {tenant.firstName} {tenant.lastName}
                                        </Link>
                                    </td>
                                    <td className="px-5 py-4 text-[var(--on-surface-variant)]">{tenant.contactInfo?.email ?? '—'}</td>
                                    <td className="px-5 py-4 text-[var(--on-surface-variant)]">{tenant.contactInfo?.phone ?? '—'}</td>
                                    <td className="px-5 py-4 text-right">
                                        <button
                                            onClick={() => openEdit(tenant)}
                                            className="text-xs px-3 py-1.5 rounded-md bg-[var(--secondary-container)] text-[var(--on-secondary-container)] hover:opacity-90 transition-opacity"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create / Edit Modal */}
            {modal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-[var(--surface-container-lowest)] rounded-lg shadow-[0_10px_40px_rgba(13,28,46,0.06)] w-full max-w-md mx-4">
                        <div className="px-6 py-4">
                            <h2 className="text-base font-semibold text-[var(--on-surface)] font-[family-name:var(--font-display)]">
                                {modal.mode === 'create' ? 'New Tenant' : 'Edit Tenant'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                                        First Name <span className="text-[var(--error)]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.firstName}
                                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                        className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                                        placeholder="Maria"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                                        Last Name <span className="text-[var(--error)]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.lastName}
                                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                        className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                                        placeholder="Santos"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--on-surface)] mb-1">Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                                    placeholder="maria@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--on-surface)] mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                                    placeholder="+63 912 345 6789"
                                />
                            </div>
                            {error && <p className="text-[var(--error)] text-sm">{error}</p>}
                            <div className="flex gap-2 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm bg-transparent text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] transition-colors rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-sm bg-[var(--primary-fixed-dim)] text-[var(--on-primary-fixed)] rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {loading ? 'Saving…' : modal.mode === 'create' ? 'Create' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
