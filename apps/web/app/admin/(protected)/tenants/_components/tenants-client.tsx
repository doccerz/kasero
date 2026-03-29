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
                <h1 className="text-2xl font-bold text-slate-800">Tenants</h1>
                <button
                    onClick={openCreate}
                    className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
                >
                    New Tenant
                </button>
            </div>

            {tenants.length === 0 ? (
                <p className="text-slate-500 text-sm">No tenants found.</p>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Name</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Email</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Phone</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.map((tenant) => (
                                <tr key={tenant.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-medium">
                                        <Link href={`/admin/tenants/${tenant.id}`} className="text-blue-600 hover:underline">
                                            {tenant.firstName} {tenant.lastName}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{tenant.contactInfo?.email ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">{tenant.contactInfo?.phone ?? '—'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => openEdit(tenant)}
                                            className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
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
                    <div className="bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-md mx-4">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h2 className="text-base font-semibold text-slate-800">
                                {modal.mode === 'create' ? 'New Tenant' : 'Edit Tenant'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.firstName}
                                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                        placeholder="Maria"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.lastName}
                                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                        placeholder="Santos"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    placeholder="maria@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    placeholder="+63 912 345 6789"
                                />
                            </div>
                            {error && <p className="text-red-600 text-sm">{error}</p>}
                            <div className="flex gap-2 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
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
