'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Space {
    id: string;
    name: string;
    description?: string;
}

interface DashboardEntry {
    id: string;
    name: string;
    occupancyStatus: 'overdue' | 'nearing' | 'occupied' | 'vacant';
    tenantId?: string;
    tenantName?: string;
    contractId?: string;
    amountDue?: string;
    nextDueDate?: string;
}

interface SpaceFormData {
    name: string;
    description: string;
}

const EMPTY_FORM: SpaceFormData = { name: '', description: '' };

const STATUS_LABELS: Record<DashboardEntry['occupancyStatus'], string> = {
    overdue: 'Overdue',
    nearing: 'Nearing',
    occupied: 'Occupied',
    vacant: 'Vacant',
};

const STATUS_CLASSES: Record<DashboardEntry['occupancyStatus'], string> = {
    overdue: 'bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded',
    nearing: 'bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded',
    occupied: 'bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded',
    vacant: 'bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded',
};

export default function SpacesClient({
    spaces,
    dashboardEntries,
}: {
    spaces: Space[];
    dashboardEntries: DashboardEntry[];
}) {
    const router = useRouter();
    const [modal, setModal] = useState<{ mode: 'create' | 'edit'; space?: Space } | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Space | null>(null);
    const [form, setForm] = useState<SpaceFormData>(EMPTY_FORM);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const dashboardMap = new Map(dashboardEntries.map((e) => [e.id, e]));

    function openCreate() {
        setForm(EMPTY_FORM);
        setError('');
        setModal({ mode: 'create' });
    }

    function openEdit(space: Space) {
        setForm({ name: space.name, description: space.description ?? '' });
        setError('');
        setModal({ mode: 'edit', space });
    }

    function closeModal() {
        setModal(null);
        setError('');
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Trim whitespace from name and validate
        const trimmedName = form.name.trim();
        if (!trimmedName) {
            setError('Space name cannot be empty or contain only whitespace');
            setLoading(false);
            return;
        }

        const isEdit = modal?.mode === 'edit';
        const url = isEdit ? `/api/admin/spaces/${modal.space!.id}` : '/api/admin/spaces';
        const method = isEdit ? 'PATCH' : 'POST';

        const body: Record<string, unknown> = { name: trimmedName };
        if (form.description) body.description = form.description;

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

    async function handleDelete() {
        if (!deleteTarget) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/admin/spaces/${deleteTarget.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.message ?? 'Failed to delete space');
            } else {
                setDeleteTarget(null);
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
                <h1 className="text-2xl font-bold text-slate-800">Spaces</h1>
                <button
                    onClick={openCreate}
                    className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
                >
                    New Space
                </button>
            </div>

            {spaces.length === 0 ? (
                <p className="text-slate-500 text-sm">No spaces found.</p>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Space Name</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Status</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Tenant</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Amount Due</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Next Due Date</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {spaces.map((space) => {
                                const entry = dashboardMap.get(space.id);
                                const status = entry?.occupancyStatus ?? 'vacant';
                                return (
                                    <tr key={space.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium">
                                            <Link href={`/admin/spaces/${space.id}`} className="text-blue-600 hover:underline">
                                                {space.name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={STATUS_CLASSES[status]}>
                                                {STATUS_LABELS[status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{entry?.tenantName ?? '—'}</td>
                                        <td className="px-4 py-3 font-mono text-slate-700">
                                            {entry?.amountDue !== undefined ? `₱${entry.amountDue}` : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{entry?.nextDueDate ?? '—'}</td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <button
                                                onClick={() => openEdit(space)}
                                                className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => { setError(''); setDeleteTarget(space); }}
                                                className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create / Edit Modal */}
            {modal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div role="dialog" className="bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-md mx-4">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h2 className="text-base font-semibold text-slate-800">
                                {modal.mode === 'create' ? 'New Space' : 'Edit Space'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                            <div>
                                <label htmlFor="space-name" className="block text-sm font-medium text-slate-700 mb-1">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="space-name"
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    placeholder="e.g. Unit 1A"
                                />
                            </div>
                            <div>
                                <label htmlFor="space-description" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    id="space-description"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                                    placeholder="Optional description"
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

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div role="dialog" className="bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-sm mx-4">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h2 className="text-base font-semibold text-slate-800">Delete Space</h2>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-sm text-slate-600">
                                Are you sure you want to delete <span className="font-semibold">{deleteTarget.name}</span>? This action cannot be undone.
                            </p>
                            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 flex gap-2 justify-end">
                            <button
                                onClick={() => { setDeleteTarget(null); setError(''); }}
                                disabled={loading}
                                className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
