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
    overdue: 'bg-[var(--error)]',
    nearing: 'bg-[#b45309]',
    occupied: 'bg-[var(--primary-fixed-dim)]',
    vacant: 'bg-[var(--outline-variant)]',
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
                <h1 className="text-2xl font-bold text-[var(--on-surface)] font-[family-name:var(--font-display)]">Spaces</h1>
                <button
                    onClick={openCreate}
                    className="px-4 py-2 bg-[var(--primary-fixed-dim)] text-[var(--on-primary-fixed)] text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
                >
                    New Space
                </button>
            </div>

            {spaces.length === 0 ? (
                <p className="text-[var(--on-surface-variant)] text-sm">No spaces found.</p>
            ) : (
                <div className="bg-[var(--surface-container-lowest)] rounded-lg overflow-hidden shadow-[0_10px_40px_rgba(13,28,46,0.06)]">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[var(--surface-container)]">
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Space Name</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Status</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Tenant</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Amount Due</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-left font-[family-name:var(--font-display)]">Next Due Date</th>
                                <th className="px-5 py-4 text-xs font-semibold text-[var(--on-surface)] uppercase tracking-wide text-right font-[family-name:var(--font-display)]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {spaces.map((space, idx) => {
                                const entry = dashboardMap.get(space.id);
                                const status = entry?.occupancyStatus ?? 'vacant';
                                const statusColor = STATUS_CLASSES[status];
                                return (
                                    <tr key={space.id} className={`hover:bg-[var(--surface-container-low)] transition-colors ${idx % 2 === 0 ? 'bg-[var(--surface-container-lowest)]' : 'bg-[var(--surface-container-low)]'}`}>
                                        <td className="px-5 py-4 font-medium">
                                            <div className="flex items-center">
                                                <span className="w-1 h-5 rounded-sm mr-3 inline-block" style={{ background: statusColor }} />
                                                <Link href={`/admin/spaces/${space.id}`} className="text-[var(--on-surface)] hover:underline">
                                                    {space.name}
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-xs font-semibold text-[var(--on-surface)]">
                                                {STATUS_LABELS[status]}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-[var(--on-surface-variant)]">{entry?.tenantName ?? '—'}</td>
                                        <td className="px-5 py-4 font-mono text-[var(--on-surface)]">
                                            {entry?.amountDue !== undefined ? `₱${entry.amountDue}` : '—'}
                                        </td>
                                        <td className="px-5 py-4 text-[var(--on-surface-variant)]">{entry?.nextDueDate ?? '—'}</td>
                                        <td className="px-5 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => openEdit(space)}
                                                className="text-xs px-3 py-1.5 rounded-md bg-[var(--secondary-container)] text-[var(--on-secondary-container)] hover:opacity-90 transition-opacity"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => { setError(''); setDeleteTarget(space); }}
                                                className="text-xs px-3 py-1.5 rounded-md bg-[var(--error-container)] text-[var(--error)] hover:opacity-90 transition-opacity"
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
                    <div role="dialog" className="bg-[var(--surface-container-lowest)] rounded-lg shadow-[0_10px_40px_rgba(13,28,46,0.06)] w-full max-w-md mx-4">
                        <div className="px-6 py-4">
                            <h2 className="text-base font-semibold text-[var(--on-surface)] font-[family-name:var(--font-display)]">
                                {modal.mode === 'create' ? 'New Space' : 'Edit Space'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                            <div>
                                <label htmlFor="space-name" className="block text-sm font-medium text-[var(--on-surface)] mb-1">
                                    Name <span className="text-[var(--error)]">*</span>
                                </label>
                                <input
                                    id="space-name"
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)]"
                                    placeholder="e.g. Unit 1A"
                                />
                            </div>
                            <div>
                                <label htmlFor="space-description" className="block text-sm font-medium text-[var(--on-surface)] mb-1">Description</label>
                                <textarea
                                    id="space-description"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-[var(--surface-container-highest)] border border-[var(--outline-variant)]/15 rounded-md text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-fixed-dim)] resize-none"
                                    placeholder="Optional description"
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

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div role="dialog" className="bg-[var(--surface-container-lowest)] rounded-lg shadow-[0_10px_40px_rgba(13,28,46,0.06)] w-full max-w-sm mx-4">
                        <div className="px-6 py-4">
                            <h2 className="text-base font-semibold text-[var(--on-surface)] font-[family-name:var(--font-display)]">Delete Space</h2>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-sm text-[var(--on-surface-variant)]">
                                Are you sure you want to delete <span className="font-semibold text-[var(--on-surface)]">{deleteTarget.name}</span>? This action cannot be undone.
                            </p>
                            {error && <p className="text-[var(--error)] text-sm mt-3">{error}</p>}
                        </div>
                        <div className="px-6 py-4 flex gap-2 justify-end">
                            <button
                                onClick={() => { setDeleteTarget(null); setError(''); }}
                                disabled={loading}
                                className="px-4 py-2 text-sm bg-transparent text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] transition-colors rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-4 py-2 text-sm bg-[var(--error)] text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
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
