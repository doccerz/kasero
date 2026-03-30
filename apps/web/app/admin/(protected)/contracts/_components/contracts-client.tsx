'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Contract {
    id: string;
    spaceId: string;
    tenantId: string;
    tenantName?: string;
    spaceName?: string;
    startDate: string;
    endDate: string;
    rentAmount: string;
    status: string;
}

interface Tenant {
    id: string;
    name: string;
}

interface Space {
    id: string;
    name: string;
}

interface ContractFormData {
    tenantId: string;
    spaceId: string;
    startDate: string;
    endDate: string;
    rentAmount: string;
    billingFrequency: string;
    dueDateRule: string;
    depositAmount: string;
    advanceMonths: string;
}

const EMPTY_FORM: ContractFormData = {
    tenantId: '',
    spaceId: '',
    startDate: '',
    endDate: '',
    rentAmount: '',
    billingFrequency: 'monthly',
    dueDateRule: '',
    depositAmount: '',
    advanceMonths: '',
};

export default function ContractsClient({
    contracts,
    tenants,
    spaces,
}: {
    contracts: Contract[];
    tenants: Tenant[];
    spaces: Space[];
}) {
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<ContractFormData>(EMPTY_FORM);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function openCreate() {
        setForm(EMPTY_FORM);
        setError('');
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setError('');
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const body: Record<string, unknown> = {
            tenantId: form.tenantId,
            spaceId: form.spaceId,
            startDate: form.startDate,
            endDate: form.endDate,
            rentAmount: parseFloat(form.rentAmount),
            billingFrequency: form.billingFrequency,
            dueDateRule: parseInt(form.dueDateRule, 10),
        };
        if (form.depositAmount) body.depositAmount = parseFloat(form.depositAmount);
        if (form.advanceMonths) body.advanceMonths = parseInt(form.advanceMonths, 10);

        try {
            const res = await fetch('/api/admin/contracts', {
                method: 'POST',
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
                <h1 className="text-2xl font-bold text-slate-800">Contracts</h1>
                <button
                    onClick={openCreate}
                    className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
                >
                    New Contract
                </button>
            </div>

            {contracts.length === 0 ? (
                <p className="text-slate-500 text-sm">No contracts found.</p>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Tenant</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Space</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Start</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">End</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Rent</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Status</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contracts.map((contract) => {
                                const isPosted = contract.status === 'posted';
                                return (
                                    <tr
                                        key={contract.id}
                                        className={`border-b border-slate-100 transition-colors ${
                                            isPosted ? 'bg-green-50' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <td className="px-4 py-3 text-slate-700">{contract.tenantName ?? contract.tenantId}</td>
                                        <td className="px-4 py-3 text-slate-700">{contract.spaceName ?? contract.spaceId}</td>
                                        <td className="px-4 py-3 text-slate-600">{contract.startDate}</td>
                                        <td className="px-4 py-3 text-slate-600">{contract.endDate}</td>
                                        <td className="px-4 py-3 font-mono text-slate-800">₱{contract.rentAmount}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                                isPosted
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {contract.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/contracts/${contract.id}`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h2 className="text-base font-semibold text-slate-800">New Contract</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Tenant <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={form.tenantId}
                                    onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                >
                                    <option value="">Select tenant…</option>
                                    {tenants.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Space <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={form.spaceId}
                                    onChange={(e) => setForm({ ...form, spaceId: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                >
                                    <option value="">Select space…</option>
                                    {spaces.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Start Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={form.startDate}
                                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        End Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={form.endDate}
                                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Rent Amount <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={form.rentAmount}
                                    onChange={(e) => setForm({ ...form, rentAmount: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    placeholder="e.g. 15000"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Billing Frequency <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={form.billingFrequency}
                                        onChange={(e) => setForm({ ...form, billingFrequency: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="annually">Annually</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Due Date Rule (day 1–31) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="31"
                                        value={form.dueDateRule}
                                        onChange={(e) => setForm({ ...form, dueDateRule: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                        placeholder="e.g. 5"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Deposit Amount</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.depositAmount}
                                        onChange={(e) => setForm({ ...form, depositAmount: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                        placeholder="Optional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Advance Months</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.advanceMonths}
                                        onChange={(e) => setForm({ ...form, advanceMonths: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                        placeholder="Optional"
                                    />
                                </div>
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
                                    {loading ? 'Creating…' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
