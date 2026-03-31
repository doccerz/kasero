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

        // Validate rent amount is greater than zero
        if (!form.rentAmount || parseFloat(form.rentAmount) <= 0) {
            setError('Rent amount must be greater than zero');
            setLoading(false);
            return;
        }

        // Validate end date is not before start date
        if (form.startDate && form.endDate && form.endDate < form.startDate) {
            setError('End date must be on or after start date');
            setLoading(false);
            return;
        }

        // Validate contract duration does not exceed 10 years
        if (form.startDate && form.endDate) {
            const start = new Date(form.startDate);
            const end = new Date(form.endDate);
            const maxEndDate = new Date(start);
            maxEndDate.setFullYear(start.getFullYear() + 10);
            if (end > maxEndDate) {
                setError('Contract duration cannot exceed 10 years');
                setLoading(false);
                return;
            }
        }

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
                <h1 className="text-2xl font-bold text-[var(--on-surface)] font-[family-name:var(--font-display)]">Contracts</h1>
                <button
                    onClick={openCreate}
                    className="px-4 py-2 bg-[var(--primary-fixed-dim)] text-[var(--on-primary-fixed)] text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
                >
                    New Contract
                </button>
            </div>

            {contracts.length === 0 ? (
                <p className="text-[var(--on-surface-variant)] text-sm">No contracts found.</p>
            ) : (
                <div className="bg-[var(--surface-container-lowest)] rounded-lg overflow-hidden shadow-[0_10px_40px_rgba(13,28,46,0.06)]">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[var(--surface-container)]">
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Tenant</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Space</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Start</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">End</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Rent</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Status</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contracts.map((contract, idx) => {
                                const isPosted = contract.status === 'posted';
                                return (
                                    <tr
                                        key={contract.id}
                                        className={`transition-colors ${
                                            isPosted ? 'bg-[var(--primary-container)]/10' : `hover:bg-[var(--surface-container-low)] ${idx % 2 === 0 ? 'bg-[var(--surface-container-lowest)]' : 'bg-[var(--surface-container-low)]'}`
                                        }`}
                                    >
                                        <td className="px-5 py-4 text-[var(--on-surface)]">{contract.tenantName ?? contract.tenantId}</td>
                                        <td className="px-5 py-4 text-[var(--on-surface)]">{contract.spaceName ?? contract.spaceId}</td>
                                        <td className="px-5 py-4 text-[var(--on-surface-variant)]">{contract.startDate}</td>
                                        <td className="px-5 py-4 text-[var(--on-surface-variant)]">{contract.endDate}</td>
                                        <td className="px-5 py-4 font-mono text-[var(--on-surface)]">₱{contract.rentAmount}</td>
                                        <td className="px-5 py-4">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                                                isPosted
                                                    ? 'bg-[var(--primary-fixed-dim)] text-[var(--on-primary-fixed)]'
                                                    : 'bg-[var(--outline-variant)] text-[var(--on-surface-variant)]'
                                            }`}>
                                                {contract.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <Link
                                                href={`/admin/contracts/${contract.id}`}
                                                className="text-[var(--on-surface)] hover:underline"
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
                    <div role="dialog" className="bg-[var(--surface-container-lowest)] rounded-lg shadow-[0_10px_40px_rgba(13,28,46,0.06)] w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4">
                            <h2 className="text-base font-semibold text-[var(--on-surface)] font-[family-name:var(--font-display)]">New Contract</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                                    Tenant <span className="text-[var(--error)]">*</span>
                                </label>
                                <select
                                    required
                                    value={form.tenantId}
                                    onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                                    className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                                >
                                    <option value="">Select tenant…</option>
                                    {tenants.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                                    Space <span className="text-[var(--error)]">*</span>
                                </label>
                                <select
                                    required
                                    value={form.spaceId}
                                    onChange={(e) => setForm({ ...form, spaceId: e.target.value })}
                                    className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                                >
                                    <option value="">Select space…</option>
                                    {spaces.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                                        Start Date <span className="text-[var(--error)]">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={form.startDate}
                                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                        className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                                        End Date <span className="text-[var(--error)]">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={form.endDate}
                                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                        className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                                    Rent Amount <span className="text-[var(--error)]">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={form.rentAmount}
                                    onChange={(e) => setForm({ ...form, rentAmount: e.target.value })}
                                    className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                                    placeholder="e.g. 15000"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                                        Billing Frequency <span className="text-[var(--error)]">*</span>
                                    </label>
                                    <select
                                        required
                                        value={form.billingFrequency}
                                        onChange={(e) => setForm({ ...form, billingFrequency: e.target.value })}
                                        className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="annually">Annually</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                                        Due Date Rule (day 1–31) <span className="text-[var(--error)]">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="31"
                                        value={form.dueDateRule}
                                        onChange={(e) => setForm({ ...form, dueDateRule: e.target.value })}
                                        className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                                        placeholder="e.g. 5"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--on-surface)] mb-1">Deposit Amount</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.depositAmount}
                                        onChange={(e) => setForm({ ...form, depositAmount: e.target.value })}
                                        className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                                        placeholder="Optional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--on-surface)] mb-1">Advance Months</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.advanceMonths}
                                        onChange={(e) => setForm({ ...form, advanceMonths: e.target.value })}
                                        className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                                        placeholder="Optional"
                                    />
                                </div>
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
