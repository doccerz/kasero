'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Contract {
    id: string;
    spaceId: string;
    tenantId: string;
    tenantName?: string;
    startDate: string;
    endDate: string;
    rentAmount?: string;
    billingFrequency?: string;
    dueDateRule?: number;
    depositAmount?: string;
    advanceMonths?: number;
    status: string;
}

interface Tenant {
    id: string;
    firstName: string;
    lastName: string;
}

interface Props {
    spaceId: string;
    contracts: Contract[];
    tenants: Tenant[];
}

const STATUS_ORDER: Record<string, number> = { posted: 0, draft: 1, voided: 2 };

function sortContracts(contracts: Contract[]) {
    return [...contracts].sort((a, b) => {
        const statusDiff = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
        if (statusDiff !== 0) return statusDiff;
        return b.startDate.localeCompare(a.startDate);
    });
}

function hasOverlap(contracts: Contract[], startDate: string, endDate: string, excludeId?: string): boolean {
    const nonVoided = contracts.filter((c) => c.status !== 'voided' && c.id !== excludeId);
    return nonVoided.some((c) => c.startDate <= endDate && c.endDate >= startDate);
}

// ── Create / Edit modal ────────────────────────────────────────────────

interface CreateFormData {
    tenantId: string;
    startDate: string;
    endDate: string;
    rentAmount: string;
    billingFrequency: string;
    dueDateRule: string;
    depositAmount: string;
    advanceMonths: string;
}

interface CreateModalProps {
    spaceId: string;
    tenants: Tenant[];
    contracts: Contract[];
    onClose: () => void;
}

function CreateModal({ spaceId, tenants, contracts, onClose }: CreateModalProps) {
    const router = useRouter();
    const [form, setForm] = useState<CreateFormData>({
        tenantId: '',
        startDate: '',
        endDate: '',
        rentAmount: '',
        billingFrequency: 'monthly',
        dueDateRule: '5',
        depositAmount: '',
        advanceMonths: '1',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const overlap = form.startDate && form.endDate
        ? hasOverlap(contracts, form.startDate, form.endDate)
        : false;

    function handleChange(field: keyof CreateFormData, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    spaceId,
                    tenantId: form.tenantId,
                    startDate: form.startDate,
                    endDate: form.endDate,
                    rentAmount: form.rentAmount,
                    billingFrequency: form.billingFrequency,
                    dueDateRule: parseInt(form.dueDateRule, 10),
                    ...(form.depositAmount ? { depositAmount: form.depositAmount } : {}),
                    ...(form.advanceMonths ? { advanceMonths: parseInt(form.advanceMonths, 10) } : {}),
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(body.message ?? 'Failed to create contract');
                return;
            }
            router.refresh();
            onClose();
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div role="dialog" aria-modal="true" className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">New Contract</h2>

                {overlap && (
                    <div role="alert" className="mb-4 px-4 py-2 rounded bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm">
                        Warning: these dates overlap with an existing active contract for this space.
                    </div>
                )}

                {error && (
                    <p className="mb-3 text-sm text-red-600">{error}</p>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label htmlFor="cc-tenantId" className="block text-sm font-medium text-slate-700 mb-1">Tenant</label>
                        <select
                            id="cc-tenantId"
                            value={form.tenantId}
                            onChange={(e) => handleChange('tenantId', e.target.value)}
                            required
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="">Select tenant…</option>
                            {tenants.map((t) => (
                                <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="cc-startDate" className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                            <input
                                id="cc-startDate"
                                type="date"
                                value={form.startDate}
                                onChange={(e) => handleChange('startDate', e.target.value)}
                                required
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="cc-endDate" className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                            <input
                                id="cc-endDate"
                                type="date"
                                value={form.endDate}
                                onChange={(e) => handleChange('endDate', e.target.value)}
                                required
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="cc-rentAmount" className="block text-sm font-medium text-slate-700 mb-1">Rent Amount</label>
                            <input
                                id="cc-rentAmount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={form.rentAmount}
                                onChange={(e) => handleChange('rentAmount', e.target.value)}
                                required
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="cc-billingFrequency" className="block text-sm font-medium text-slate-700 mb-1">Billing Frequency</label>
                            <select
                                id="cc-billingFrequency"
                                value={form.billingFrequency}
                                onChange={(e) => handleChange('billingFrequency', e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="annually">Annually</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="cc-dueDateRule" className="block text-sm font-medium text-slate-700 mb-1">Due Date (day of month)</label>
                            <input
                                id="cc-dueDateRule"
                                type="number"
                                min="1"
                                max="31"
                                value={form.dueDateRule}
                                onChange={(e) => handleChange('dueDateRule', e.target.value)}
                                required
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="cc-depositAmount" className="block text-sm font-medium text-slate-700 mb-1">Deposit Amount</label>
                            <input
                                id="cc-depositAmount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.depositAmount}
                                onChange={(e) => handleChange('depositAmount', e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="cc-advanceMonths" className="block text-sm font-medium text-slate-700 mb-1">Advance Months</label>
                        <input
                            id="cc-advanceMonths"
                            type="number"
                            min="0"
                            value={form.advanceMonths}
                            onChange={(e) => handleChange('advanceMonths', e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="flex gap-2 pt-2 justify-end">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50">
                            {loading ? 'Creating…' : 'Create Contract'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Edit modal ─────────────────────────────────────────────────────────

interface EditModalProps {
    contract: Contract;
    onClose: () => void;
}

function EditModal({ contract, onClose }: EditModalProps) {
    const router = useRouter();
    const [form, setForm] = useState({
        startDate: contract.startDate,
        endDate: contract.endDate,
        rentAmount: contract.rentAmount ?? '',
        billingFrequency: contract.billingFrequency ?? 'monthly',
        dueDateRule: String(contract.dueDateRule ?? 5),
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    function handleChange(field: string, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/admin/contracts/${contract.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate: form.startDate,
                    endDate: form.endDate,
                    rentAmount: form.rentAmount,
                    billingFrequency: form.billingFrequency,
                    dueDateRule: parseInt(form.dueDateRule, 10),
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(body.message ?? 'Failed to update contract');
                return;
            }
            router.refresh();
            onClose();
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div role="dialog" aria-modal="true" aria-label="Edit Contract" className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Edit Contract</h2>
                {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="ec-startDate" className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                            <input id="ec-startDate" type="date" value={form.startDate} onChange={(e) => handleChange('startDate', e.target.value)} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label htmlFor="ec-endDate" className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                            <input id="ec-endDate" type="date" value={form.endDate} onChange={(e) => handleChange('endDate', e.target.value)} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="ec-rentAmount" className="block text-sm font-medium text-slate-700 mb-1">Rent Amount</label>
                            <input id="ec-rentAmount" type="number" step="0.01" min="0.01" value={form.rentAmount} onChange={(e) => handleChange('rentAmount', e.target.value)} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label htmlFor="ec-billingFrequency" className="block text-sm font-medium text-slate-700 mb-1">Billing Frequency</label>
                            <select id="ec-billingFrequency" value={form.billingFrequency} onChange={(e) => handleChange('billingFrequency', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="annually">Annually</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="ec-dueDateRule" className="block text-sm font-medium text-slate-700 mb-1">Due Date (day of month)</label>
                        <input id="ec-dueDateRule" type="number" min="1" max="31" value={form.dueDateRule} onChange={(e) => handleChange('dueDateRule', e.target.value)} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div className="flex gap-2 pt-2 justify-end">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50">
                            {loading ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Confirmation dialogs ────────────────────────────────────────────────

interface PostConfirmProps {
    contractId: string;
    onClose: () => void;
}

function PostConfirmDialog({ contractId, onClose }: PostConfirmProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleConfirm() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/admin/contracts/${contractId}/post`, { method: 'POST' });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(body.message ?? 'Failed to post contract');
                return;
            }
            router.refresh();
            onClose();
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div role="dialog" aria-modal="true" className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-2">Post this contract?</h2>
                <p className="text-sm text-slate-600 mb-4">Once posted, this contract cannot be edited. Payables will be generated.</p>
                {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <div className="flex gap-2 justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">Cancel</button>
                    <button onClick={handleConfirm} disabled={loading} className="px-4 py-2 text-sm rounded-lg bg-green-700 text-white hover:bg-green-600 disabled:opacity-50">
                        {loading ? 'Posting…' : 'Post Contract'}
                    </button>
                </div>
            </div>
        </div>
    );
}

interface VoidConfirmProps {
    contractId: string;
    onClose: () => void;
}

function VoidConfirmDialog({ contractId, onClose }: VoidConfirmProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleConfirm() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/admin/contracts/${contractId}/void`, { method: 'POST' });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(body.message ?? 'Failed to void contract');
                return;
            }
            router.refresh();
            onClose();
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div role="dialog" aria-modal="true" className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-2">Void this contract?</h2>
                <p className="text-sm text-slate-600 mb-4">This action cannot be undone. The space will show as Vacant.</p>
                {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <div className="flex gap-2 justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">Cancel</button>
                    <button onClick={handleConfirm} disabled={loading} className="px-4 py-2 text-sm rounded-lg bg-red-700 text-white hover:bg-red-600 disabled:opacity-50">
                        {loading ? 'Voiding…' : 'Void Contract'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main client component ──────────────────────────────────────────────

type ModalState =
    | { type: 'create' }
    | { type: 'edit'; contract: Contract }
    | { type: 'post'; contractId: string }
    | { type: 'void'; contractId: string }
    | null;

export default function SpaceContractsClient({ spaceId, contracts, tenants }: Props) {
    const [showVoided, setShowVoided] = useState(false);
    const [modal, setModal] = useState<ModalState>(null);

    const visibleContracts = sortContracts(
        showVoided ? contracts : contracts.filter((c) => c.status !== 'voided')
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Contracts</h2>
                <button
                    onClick={() => setModal({ type: 'create' })}
                    className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-700"
                >
                    New Contract
                </button>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600 mb-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={showVoided}
                    onChange={(e) => setShowVoided(e.target.checked)}
                    aria-label="Show voided contracts"
                />
                Show voided contracts
            </label>

            {visibleContracts.length === 0 ? (
                <p className="text-slate-500 text-sm">No contracts for this space.</p>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Tenant</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Start</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">End</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Status</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleContracts.map((contract) => {
                                const isPosted = contract.status === 'posted';
                                const isDraft = contract.status === 'draft';
                                const isVoided = contract.status === 'voided';
                                return (
                                    <tr
                                        key={contract.id}
                                        className={`border-b border-slate-100 ${
                                            isVoided
                                                ? 'text-slate-400'
                                                : isPosted
                                                  ? 'bg-green-50 font-semibold'
                                                  : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <td className="px-4 py-3 text-slate-700">{contract.tenantName ?? contract.tenantId}</td>
                                        <td className="px-4 py-3 text-slate-600">{contract.startDate}</td>
                                        <td className="px-4 py-3 text-slate-600">{contract.endDate}</td>
                                        <td className="px-4 py-3 text-slate-600">{contract.status}</td>
                                        <td className="px-4 py-3 flex items-center gap-2">
                                            <Link href={`/admin/contracts/${contract.id}`} className="text-blue-600 hover:underline text-sm">
                                                View
                                            </Link>
                                            {isDraft && (
                                                <>
                                                    <button
                                                        onClick={() => setModal({ type: 'edit', contract })}
                                                        className="text-slate-600 hover:underline text-sm"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setModal({ type: 'post', contractId: contract.id })}
                                                        className="text-green-700 hover:underline text-sm"
                                                    >
                                                        Post
                                                    </button>
                                                    <button
                                                        onClick={() => setModal({ type: 'void', contractId: contract.id })}
                                                        className="text-red-600 hover:underline text-sm"
                                                    >
                                                        Void
                                                    </button>
                                                </>
                                            )}
                                            {isPosted && (
                                                <button
                                                    onClick={() => setModal({ type: 'void', contractId: contract.id })}
                                                    className="text-red-600 hover:underline text-sm"
                                                >
                                                    Void
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {modal?.type === 'create' && (
                <CreateModal
                    spaceId={spaceId}
                    tenants={tenants}
                    contracts={contracts}
                    onClose={() => setModal(null)}
                />
            )}
            {modal?.type === 'edit' && (
                <EditModal
                    contract={modal.contract}
                    onClose={() => setModal(null)}
                />
            )}
            {modal?.type === 'post' && (
                <PostConfirmDialog
                    contractId={modal.contractId}
                    onClose={() => setModal(null)}
                />
            )}
            {modal?.type === 'void' && (
                <VoidConfirmDialog
                    contractId={modal.contractId}
                    onClose={() => setModal(null)}
                />
            )}
        </div>
    );
}
