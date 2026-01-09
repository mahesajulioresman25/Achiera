'use client';

import { use, useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface LifecycleStep {
    id: string;
    title: string;
    description: string;
    icon?: string;
    sortOrder: number;
    isActive: boolean;
}

export default function LifecyclePage({ params }: { params: Promise<{ brandSlug: string }> }) {
    const { brandSlug } = use(params);
    const [steps, setSteps] = useState<LifecycleStep[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStep, setEditingStep] = useState<LifecycleStep | null>(null);

    useEffect(() => {
        fetchSteps();
    }, [brandSlug]);

    const fetchSteps = async () => {
        try {
            const res = await fetch(`/api/admin/${brandSlug}/lifecycle`);
            const data = await res.json();
            setSteps(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch lifecycle steps:', error);
            setSteps([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this lifecycle step?')) return;

        try {
            const res = await fetch(`/api/admin/${brandSlug}/lifecycle/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Langkah berhasil dihapus');
                fetchSteps();
            } else {
                toast.error('Gagal menghapus langkah');
            }
        } catch (error) {
            console.error('Failed to delete lifecycle step:', error);
            toast.error('Gagal menghapus langkah');
        }
    };

    const openEditModal = (step?: LifecycleStep) => {
        setEditingStep(step || null);
        setShowModal(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-stone-600">Loading lifecycle steps...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Development Lifecycle</h1>
                    <p className="text-stone-600">Manage your development process steps</p>
                </div>
                <button
                    onClick={() => openEditModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Step
                </button>
            </div>

            {/* Steps List */}
            {steps.length === 0 ? (
                <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
                    <p className="text-stone-600 mb-4">No lifecycle steps yet</p>
                    <button
                        onClick={() => openEditModal()}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Create your first lifecycle step
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className="bg-white rounded-xl border border-stone-200 p-6 flex items-start gap-4"
                        >
                            <div className="cursor-move text-stone-400">
                                <GripVertical className="w-5 h-5" />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                                {index + 1}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-stone-900">{step.title}</h3>
                                        {step.icon && (
                                            <span className="text-sm text-stone-500">Icon: {step.icon}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${step.isActive
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-stone-100 text-stone-600'
                                                }`}
                                        >
                                            {step.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <button
                                            onClick={() => openEditModal(step)}
                                            className="p-2 text-stone-600 hover:text-blue-600 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(step.id)}
                                            className="p-2 text-stone-600 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-stone-600">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <LifecycleStepModal
                    brandSlug={brandSlug}
                    step={editingStep}
                    onClose={() => {
                        setShowModal(false);
                        setEditingStep(null);
                    }}
                    onSave={() => {
                        fetchSteps();
                        setShowModal(false);
                        setEditingStep(null);
                    }}
                />
            )}
        </div>
    );
}

function LifecycleStepModal({
    brandSlug,
    step,
    onClose,
    onSave,
}: {
    brandSlug: string;
    step: LifecycleStep | null;
    onClose: () => void;
    onSave: () => void;
}) {
    const [formData, setFormData] = useState({
        title: step?.title || '',
        description: step?.description || '',
        icon: step?.icon || '',
        isActive: step?.isActive !== undefined ? step.isActive : true,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = step
                ? `/api/admin/${brandSlug}/lifecycle/${step.id}`
                : `/api/admin/${brandSlug}/lifecycle`;
            const method = step ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success('Langkah berhasil disimpan');
                onSave();
            } else {
                toast.error('Gagal menyimpan langkah');
            }
        } catch (error) {
            console.error('Failed to save lifecycle step:', error);
            toast.error('Gagal menyimpan langkah');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-stone-200">
                    <h2 className="text-xl font-bold text-stone-900">
                        {step ? 'Edit Lifecycle Step' : 'Add New Lifecycle Step'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Step Title *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Discovery & Planning"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            rows={4}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="We analyze your requirements and create a detailed project roadmap"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Icon (Lucide icon name)
                        </label>
                        <input
                            type="text"
                            value={formData.icon}
                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Search, Code, Rocket, etc."
                        />
                        <p className="text-xs text-stone-500 mt-1">
                            Browse icons at{' '}
                            <a
                                href="https://lucide.dev/icons/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >
                                lucide.dev
                            </a>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-stone-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-stone-700">
                            Active
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Step'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
