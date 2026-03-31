'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Contract {
    id: string;
    spaceId: string;
    tenantId: string;
    tenantName?: string;
    startDate: string;
    endDate: string;
    rentAmount: string;
    billingFrequency: string;
    dueDateRule: number;
    billingDateRule?: number;
    status: string;
}

interface Payment {
    id: string;
    date: string;
    amount: string;
    voidedAt?: string | null;
}

interface EditFormData {
    startDate: string;
    endDate: string;
    rentAmount: string;
    billingFrequency: string;
    dueDateRule: string;
    billingDateRule: string;
}

export default function ContractDetailClient({
    contract,
    payments,
}: {
    contract: Contract;
    payments: Payment[];
}) {
    const router = useRouter();
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPostConfirm, setShowPostConfirm] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editForm, setEditForm] = useState<EditFormData>({
        startDate: contract.startDate,
        endDate: contract.endDate,
        rentAmount: contract.rentAmount,
        billingFrequency: contract.billingFrequency,
        dueDateRule: String(contract.dueDateRule),
        billingDateRule: contract.billingDateRule != null ? String(contract.billingDateRule) : '',
    });
    const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0] });
    const [showVoidConfirm, setShowVoidConfirm] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isDraft = contract.status === 'draft';
    const isPosted = contract.status === 'posted';

    async function handleEdit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const body: Record<string, unknown> = {
            startDate: editForm.startDate,
            endDate: editForm.endDate,
            rentAmount: parseFloat(editForm.rentAmount),
            billingFrequency: editForm.billingFrequency,
            dueDateRule: parseInt(editForm.dueDateRule, 10),
        };
        if (editForm.billingDateRule) {
            body.billingDateRule = parseInt(editForm.billingDateRule, 10);
        }

        try {
            const res = await fetch(`/api/admin/contracts/${contract.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.message ?? 'Something went wrong');
            } else {
                setShowEditModal(false);
                router.refresh();
            }
        } catch {
            setError('Unable to reach server');
        } finally {
            setLoading(false);
        }
    }

    async function handlePost() {
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/admin/contracts/${contract.id}/post`, {
                method: 'POST',
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.message ?? 'Failed to post contract');
            } else {
                setShowPostConfirm(false);
                router.refresh();
            }
        } catch {
            setError('Unable to reach server');
        } finally {
            setLoading(false);
        }
    }

    async function handleRecordPayment(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/admin/contracts/${contract.id}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(paymentForm.amount),
                    date: paymentForm.date,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.message ?? 'Failed to record payment');
            } else {
                setShowPaymentModal(false);
                setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0] });
                router.refresh();
            }
        } catch {
            setError('Unable to reach server');
        } finally {
            setLoading(false);
        }
    }

    async function handleVoidContract() {
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/admin/contracts/${contract.id}/void`, {
                method: 'POST',
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.message ?? 'Failed to void contract');
            } else {
                setShowVoidConfirm(false);
                router.refresh();
            }
        } catch {
            setError('Unable to reach server');
        } finally {
            setLoading(false);
        }
    }

    async function handleVoidPayment(paymentId: string) {
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/admin/payments/${paymentId}/void`, {
                method: 'POST',
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.message ?? 'Failed to void payment');
            } else {
                router.refresh();
            }
        } catch {
            setError('Unable to reach server');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            {/* Action buttons */}
            <div className="flex gap-2 mb-6">
                {isDraft && (
                    <>
                        <button
                            onClick={() => { setError(''); setShowEditModal(true); }}
                            className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Edit Contract
                        </button>
                        <button
                            onClick={() => { setError(''); setShowPostConfirm(true); }}
                            className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Post Contract
                        </button>
                    </>
                )}
                {isPosted && (
                    <>
                        <button
                            onClick={() => { setError(''); setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0] }); setShowPaymentModal(true); }}
                            className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Record Payment
                        </button>
                        <button
                            onClick={() => { setError(''); setShowVoidConfirm(true); }}
                            className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            Void Contract
                        </button>
                    </>
                )}
            </div>

            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

            {/* Payments table with Void buttons (posted only) */}
            {isPosted && payments.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Date</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Amount</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Voided</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p) => (
                                <tr
                                    key={p.id}
                                    className={`border-b border-slate-100 ${
                                        p.voidedAt ? 'text-slate-400' : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                >
                                    <td className="px-4 py-3">{p.date}</td>
                                    <td className="px-4 py-3 font-mono">₱{p.amount}</td>
                                    <td className="px-4 py-3">{p.voidedAt ? 'Yes' : 'No'}</td>
                                    <td className="px-4 py-3 text-right">
                                        {!p.voidedAt && (
                                            <button
                                                onClick={() => handleVoidPayment(p.id)}
                                                disabled={loading}
                                                className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                            >
                                                Void
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div role="dialog" className="bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h2 className="text-base font-semibold text-slate-800">Edit Contract</h2>
                        </div>
                        <form onSubmit={handleEdit} className="px-6 py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Start Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={editForm.startDate}
                                        onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
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
                                        value={editForm.endDate}
                                        onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
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
                                    value={editForm.rentAmount}
                                    onChange={(e) => setEditForm({ ...editForm, rentAmount: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Billing Frequency <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={editForm.billingFrequency}
                                        onChange={(e) => setEditForm({ ...editForm, billingFrequency: e.target.value })}
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
                                        value={editForm.dueDateRule}
                                        onChange={(e) => setEditForm({ ...editForm, dueDateRule: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="billing-date-rule" className="block text-sm font-medium text-slate-700 mb-1">
                                    Billing Date Rule (day 1–31, optional)
                                </label>
                                <input
                                    id="billing-date-rule"
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={editForm.billingDateRule}
                                    onChange={(e) => setEditForm({ ...editForm, billingDateRule: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    placeholder="Leave blank to use Due Date Rule"
                                />
                            </div>
                            {error && <p className="text-red-600 text-sm">{error}</p>}
                            <div className="flex gap-2 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
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
                                    {loading ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Post Confirmation */}
            {showPostConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div role="dialog" className="bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-sm mx-4">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h2 className="text-base font-semibold text-slate-800">Post Contract</h2>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-sm text-slate-600">
                                Are you sure you want to post this contract? This will generate payables and cannot be undone.
                            </p>
                            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 flex gap-2 justify-end">
                            <button
                                onClick={() => setShowPostConfirm(false)}
                                disabled={loading}
                                className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePost}
                                disabled={loading}
                                className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Posting…' : 'Post Contract'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Void Contract Confirmation */}
            {showVoidConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div role="dialog" className="bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-sm mx-4">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h2 className="text-base font-semibold text-slate-800">Void Contract</h2>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-sm text-slate-600">
                                Voiding prevents future payments and shows the space as Vacant. This action cannot be undone.
                            </p>
                            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 flex gap-2 justify-end">
                            <button
                                onClick={() => { setShowVoidConfirm(false); setError(''); }}
                                disabled={loading}
                                className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVoidContract}
                                disabled={loading}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Voiding…' : 'Void Contract'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Record Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div role="dialog" className="bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-md mx-4">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h2 className="text-base font-semibold text-slate-800">Record Payment</h2>
                        </div>
                        <form onSubmit={handleRecordPayment} className="px-6 py-4 space-y-4">
                            <div>
                                <label htmlFor="payment-amount" className="block text-sm font-medium text-slate-700 mb-1">
                                    Amount <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="payment-amount"
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    placeholder="e.g. 15000"
                                />
                            </div>
                            <div>
                                <label htmlFor="payment-date" className="block text-sm font-medium text-slate-700 mb-1">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="payment-date"
                                    type="date"
                                    required
                                    value={paymentForm.date}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                />
                            </div>
                            {error && <p className="text-red-600 text-sm">{error}</p>}
                            <div className="flex gap-2 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
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
                                    {loading ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
