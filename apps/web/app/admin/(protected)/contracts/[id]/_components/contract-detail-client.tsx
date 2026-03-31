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

        const amount = parseFloat(paymentForm.amount);
        if (isNaN(amount) || amount <= 0) {
            setError('Payment amount must be greater than zero');
            setLoading(false);
            return;
        }

        // Validate payment date is not before contract start date
        if (paymentForm.date < contract.startDate) {
            setError(`Payment date cannot be before contract start date (${contract.startDate})`);
            setLoading(false);
            return;
        }

        // Validate payment date is not in the future
        const today = new Date().toISOString().split('T')[0];
        if (paymentForm.date > today) {
            setError('Payment date cannot be in the future');
            setLoading(false);
            return;
        }

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
                            className="px-4 py-2 text-sm bg-[var(--secondary-container)] text-[var(--on-secondary-container)] rounded-md hover:opacity-90 transition-opacity"
                        >
                            Edit Contract
                        </button>
                        <button
                            onClick={() => { setError(''); setShowPostConfirm(true); }}
                            className="px-4 py-2 text-sm bg-[var(--primary-fixed-dim)] text-[var(--on-primary-fixed)] rounded-md hover:opacity-90 transition-opacity"
                        >
                            Post Contract
                        </button>
                    </>
                )}
                {isPosted && (
                    <>
                        <button
                            onClick={() => { setError(''); setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0] }); setShowPaymentModal(true); }}
                            className="px-4 py-2 text-sm bg-[var(--primary-fixed-dim)] text-[var(--on-primary-fixed)] rounded-md hover:opacity-90 transition-opacity"
                        >
                            Record Payment
                        </button>
                        <button
                            onClick={() => { setError(''); setShowVoidConfirm(true); }}
                            className="px-4 py-2 text-sm bg-[var(--error-container)] text-[var(--error)] rounded-md hover:opacity-90 transition-opacity"
                        >
                            Void Contract
                        </button>
                    </>
                )}
            </div>

            {error && <p className="text-[var(--error)] text-sm mb-4">{error}</p>}

            {/* Payments */}
            {isPosted && payments.length > 0 && (
                <>
                    <h2 className="text-sm font-semibold text-[var(--on-surface)] uppercase tracking-wide mb-3 mt-6 font-[family-name:var(--font-display)]">
                        Payments
                    </h2>
                    <div className="bg-[var(--surface-container-lowest)] rounded-lg overflow-hidden shadow-[0_10px_40px_rgba(13,28,46,0.06)] mb-6">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[var(--surface-container)]">
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Date</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Amount</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Voided</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-right font-[family-name:var(--font-display)]">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p) => (
                                <tr
                                    key={p.id}
                                    className={`transition-colors ${
                                        p.voidedAt ? 'text-[var(--on-surface-variant)]' : 'hover:bg-[var(--surface-container-low)] text-[var(--on-surface)]'
                                    }`}
                                >
                                    <td className="px-5 py-4">{p.date}</td>
                                    <td className="px-5 py-4 font-mono">₱{p.amount}</td>
                                    <td className="px-5 py-4">{p.voidedAt ? 'Yes' : 'No'}</td>
                                    <td className="px-5 py-4 text-right">
                                        {!p.voidedAt && (
                                            <button
                                                onClick={() => handleVoidPayment(p.id)}
                                                disabled={loading}
                                                className="text-xs px-3 py-1.5 rounded-md bg-[var(--error-container)] text-[var(--error)] hover:opacity-90 transition-opacity disabled:opacity-50"
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
                </>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div role="dialog" className="bg-[var(--surface-container-lowest)] rounded-lg shadow-[0_10px_40px_rgba(13,28,46,0.06)] w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4">
                            <h2 className="text-base font-semibold text-[var(--on-surface)] font-[family-name:var(--font-display)]">Edit Contract</h2>
                        </div>
                        <form onSubmit={handleEdit} className="px-6 py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                                        Start Date <span className="text-[var(--error)]">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={editForm.startDate}
                                        onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
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
                                        value={editForm.endDate}
                                        onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
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
                                    value={editForm.rentAmount}
                                    onChange={(e) => setEditForm({ ...editForm, rentAmount: e.target.value })}
                                    className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                                        Billing Frequency <span className="text-[var(--error)]">*</span>
                                    </label>
                                    <select
                                        required
                                        value={editForm.billingFrequency}
                                        onChange={(e) => setEditForm({ ...editForm, billingFrequency: e.target.value })}
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
                                        value={editForm.dueDateRule}
                                        onChange={(e) => setEditForm({ ...editForm, dueDateRule: e.target.value })}
                                        className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="billing-date-rule" className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                                    Billing Date Rule (day 1–31, optional)
                                </label>
                                <input
                                    id="billing-date-rule"
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={editForm.billingDateRule}
                                    onChange={(e) => setEditForm({ ...editForm, billingDateRule: e.target.value })}
                                    className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                                    placeholder="Leave blank to use Due Date Rule"
                                />
                            </div>
                            {error && <p className="text-[var(--error)] text-sm">{error}</p>}
                            <div className="flex gap-2 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
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
                    <div role="dialog" className="bg-[var(--surface-container-lowest)] rounded-lg shadow-[0_10px_40px_rgba(13,28,46,0.06)] w-full max-w-sm mx-4">
                        <div className="px-6 py-4">
                            <h2 className="text-base font-semibold text-[var(--on-surface)] font-[family-name:var(--font-display)]">Post Contract</h2>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-sm text-[var(--on-surface-variant)]">
                                Are you sure you want to post this contract? This will generate payables and cannot be undone.
                            </p>
                            {error && <p className="text-[var(--error)] text-sm mt-3">{error}</p>}
                        </div>
                        <div className="px-6 py-4 flex gap-2 justify-end">
                            <button
                                onClick={() => setShowPostConfirm(false)}
                                disabled={loading}
                                className="px-4 py-2 text-sm bg-transparent text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] transition-colors rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePost}
                                disabled={loading}
                                className="px-4 py-2 text-sm bg-[var(--primary-fixed-dim)] text-[var(--on-primary-fixed)] rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
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
                    <div role="dialog" className="bg-[var(--surface-container-lowest)] rounded-lg shadow-[0_10px_40px_rgba(13,28,46,0.06)] w-full max-w-sm mx-4">
                        <div className="px-6 py-4">
                            <h2 className="text-base font-semibold text-[var(--on-surface)] font-[family-name:var(--font-display)]">Void Contract</h2>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-sm text-[var(--on-surface-variant)]">
                                Voiding prevents future payments and shows the space as Vacant. This action cannot be undone.
                            </p>
                            {error && <p className="text-[var(--error)] text-sm mt-3">{error}</p>}
                        </div>
                        <div className="px-6 py-4 flex gap-2 justify-end">
                            <button
                                onClick={() => { setShowVoidConfirm(false); setError(''); }}
                                disabled={loading}
                                className="px-4 py-2 text-sm bg-transparent text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] transition-colors rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVoidContract}
                                disabled={loading}
                                className="px-4 py-2 text-sm bg-[var(--error)] text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
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
                    <div role="dialog" className="bg-[var(--surface-container-lowest)] rounded-lg shadow-[0_10px_40px_rgba(13,28,46,0.06)] w-full max-w-md mx-4">
                        <div className="px-6 py-4">
                            <h2 className="text-base font-semibold text-[var(--on-surface)] font-[family-name:var(--font-display)]">Record Payment</h2>
                        </div>
                        <form onSubmit={handleRecordPayment} className="px-6 py-4 space-y-4">
                            <div>
                                <label htmlFor="payment-amount" className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                                    Amount <span className="text-[var(--error)]">*</span>
                                </label>
                                <input
                                    id="payment-amount"
                                    type="number"
                                    required
                                    min="0.01"
                                    step="0.01"
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                                    placeholder="e.g. 15000"
                                />
                            </div>
                            <div>
                                <label htmlFor="payment-date" className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                                    Date <span className="text-[var(--error)]">*</span>
                                </label>
                                <input
                                    id="payment-date"
                                    type="date"
                                    required
                                    value={paymentForm.date}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                    className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                                />
                            </div>
                            {error && <p className="text-[var(--error)] text-sm">{error}</p>}
                            <div className="flex gap-2 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
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
